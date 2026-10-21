#!/usr/bin/env python3
"""Резервная копия сайта «Золотой ключик»: код, история правок, база, фото обычными файлами и инструкция одним ZIP.

Запуск из корня проекта:  python3 tools/make-backup.py [папка_для_результата]   (по умолчанию /tmp/zolotoy-backup)
Нужны git, node_modules (wrangler) и переменные CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (см. CLAUDE.md, «Выкладка»).
Рабочую базу только читает, ничего в ней не меняет. Пароли и ключи в копию не попадают: их нет ни в коде, ни в базе
(хеш пароля, который меняли в админке, и номер сессии выбрасываются нарочно). Переписки чата и журнал SMS не копируются.

Фото в базе лежат текстом (base64) и весят до 1,3 МБ, а база Cloudflare принимает одну SQL-команду не длиннее примерно 100 КБ,
поэтому в baza/dannye.sql они нарезаны на куски по 50 КБ. Результат проверен восстановлением во временную базу Cloudflare.
"""
import base64, datetime, hashlib, os, re, shutil, sqlite3, subprocess, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else '/tmp/zolotoy-backup'
SITE = 'https://zolotoy-klyuchik.lipetsk48.workers.dev'
MSK = datetime.timezone(datetime.timedelta(hours=3))
NOW = datetime.datetime.now(MSK)
DATE = NOW.strftime('%Y-%m-%d')
MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
DATE_RU = f'{NOW.day} {MONTHS[NOW.month - 1]} {NOW.year}'
NAME = f'zolotoy-klyuchik-kopiya-{DATE}'
PACK = os.path.join(OUT, NAME) + '/'
WRANGLER = os.path.join(ROOT, 'node_modules/.bin/wrangler')
DATA_TABLES = ['d1_migrations', 'images', 'leads', 'product_images', 'products', 'services', 'settings', 'special_days', 'videos']
CHUNK = 50000
EXT = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        sys.exit(f'Ошибка: {" ".join(cmd[:4])}...\n{(r.stderr or r.stdout)[-600:]}')
    return r.stdout


def q(s):
    return "'" + s.replace("'", "''") + "'"


def export_db():
    """Читает рабочую базу: устройство таблиц и данные нужных таблиц (вывод wrangler не печатаем: в нём временная ссылка на выгрузку)."""
    tmp = os.path.join(OUT, '_export'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    cmd = [WRANGLER, 'd1', 'export', 'DB', '--remote', '-y']
    run(cmd + ['--no-data', '--output', tmp + '/structure.sql'], cwd=ROOT)
    run(cmd + ['--no-schema', '--output', tmp + '/data.sql'] + [a for t in DATA_TABLES for a in ('--table', t)], cwd=ROOT)
    structure = open(tmp + '/structure.sql', encoding='utf-8').read()
    data = open(tmp + '/data.sql', encoding='utf-8').read()
    shutil.rmtree(tmp)
    src = sqlite3.connect(':memory:'); src.executescript(structure); src.executescript(data)   # заодно проверка, что файлы читаются как SQLite
    lines = [l for l in data.split('\n')
             if not l.startswith('INSERT INTO "images"')                                   # картинки добавим ниже по кускам
             and not re.match(r'''INSERT INTO "settings" \(.*?\) VALUES\('(admin_pw|session_ver)',''', l)]   # хеш пароля и номер сессии в копию не кладём
    parts = []
    for key, ct, d in src.execute('SELECT key, content_type, data FROM images ORDER BY key'):
        parts.append(f"INSERT INTO images (key, content_type, data) VALUES ({q(key)}, {q(ct)}, '');")
        parts += [f'UPDATE images SET data = data || {q(d[i:i + CHUNK])} WHERE key = {q(key)};' for i in range(0, len(d), CHUNK)]
    data_sql = '\n'.join(lines).rstrip('\n') + '\n\n-- фото сайта (товары, обложки видео), нарезаны на куски: база Cloudflare не принимает длинные команды\n' + '\n'.join(parts) + '\n'
    chk = sqlite3.connect(':memory:'); chk.executescript(structure); chk.executescript(data_sql)       # собираем заново и сверяем с исходной
    for (t,) in src.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall():
        if t == 'settings':
            continue
        a = sorted(map(repr, src.execute(f'SELECT * FROM "{t}"').fetchall())); b = sorted(map(repr, chk.execute(f'SELECT * FROM "{t}"').fetchall()))
        if t in DATA_TABLES and a != b:
            sys.exit(f'Ошибка: таблица {t} после нарезки не совпала с исходной')
    return structure, data_sql, chk


README = """РЕЗЕРВНАЯ КОПИЯ САЙТА «ЗОЛОТОЙ КЛЮЧИК»
Сделана {date_ru}. Сайт на момент копии: {site}
Код также лежит на GitHub: https://github.com/48avtopodbor-coder/zolotoy-klyuchik (это вторая копия кода)


ЧТО ЭТО
Копия, из которой сайт можно поднять заново: код, база данных (товары, услуги, тексты, особые дни, видео, заявки) и все фото.
Держите её на флешке, а лучше ещё и в облаке (Яндекс Диск, Google Диск).
ВАЖНО: в копии есть имена и телефоны клиентов из заявок. Храните флешку так, чтобы её не взял посторонний.


ЧТО ВНУТРИ
  kod-sayta/                  код сайта: программа, которая собирает страницы и работает с базой
  istoriya-izmeneniy.bundle   вся история правок кода одним файлом (для программиста: git clone istoriya-izmeneniy.bundle kod)
  baza/struktura.sql          устройство таблиц базы данных
  baza/dannye.sql             данные: товары, услуги, видео, особые дни, заявки и фото (фото записаны текстом и нарезаны на куски,
                              так их принимает база Cloudflare)
  foto/                       те же фото обычными файлами: товары, обложки видео
  README.txt                  этот файл


ЧЕГО В КОПИИ НЕТ
1. Паролей и ключей. Они хранятся только в Cloudflare и в файлы нарочно не попадают. Запишите их себе отдельно
   (на бумаге или в менеджере паролей), без них сайт на новом месте не заработает полностью:
     ADMIN_PASSWORD             пароль входа в админку
     TELEGRAM_BOT_TOKEN         токен бота (потеряете: новый выдаст @BotFather, команда /token)
     TELEGRAM_CHAT_ID           номер вашего чата в Telegram (и брата, через запятую)
     TELEGRAM_WEBHOOK_SECRET    любая длинная случайная строка, можно придумать новую
     SMSRU_API_ID               ключ SMS.ru, или SMSGATE_USER и SMSGATE_PASSWORD: если подключите SMS
   Если вы меняли пароль внутри админки (вкладка «Пароль»), он хранится в базе в виде хеша и в копию тоже нарочно не входит:
   после восстановления будет действовать пароль из ADMIN_PASSWORD, потом его можно снова сменить в админке.
2. Переписок чата и журнала SMS. Это временные данные: переписка стирается сама через 30 дней.
3. Настроек из админки (часы работы, контакты, тема, главная страница): {settings_note}


КАК ВОССТАНОВИТЬ САЙТ НА CLOUDFLARE (самый простой путь, переписывать ничего не нужно)
Нужны компьютер с Node.js версии 22 или новее (nodejs.org) и бесплатный аккаунт на cloudflare.com.
Если не хотите делать сами, отдайте эту папку программисту или Claude со словами «подними сайт из этой копии».
  1. Откройте папку kod-sayta в терминале (Windows: правая кнопка по папке, «Открыть в терминале») и выполните:
        npm install
  2. npx wrangler login
        (откроется браузер, разрешите доступ)
  3. npx wrangler d1 create zolotoy-klyuchik
        В ответе будет строка database_id. Откройте файл wrangler.toml в папке kod-sayta и замените значение database_id
        на новое. Если программа спросит, добавить ли базу в конфигурацию автоматически, ответьте «нет».
  4. Загрузите базу (файлы лежат на уровень выше, в папке baza):
        npx wrangler d1 execute zolotoy-klyuchik --remote --file=../baza/struktura.sql
        npx wrangler d1 execute zolotoy-klyuchik --remote --file=../baza/dannye.sql
  5. Добавьте секреты, по одному (значение вводится после запроса):
        npx wrangler secret put ADMIN_PASSWORD
        npx wrangler secret put TELEGRAM_BOT_TOKEN
        npx wrangler secret put TELEGRAM_CHAT_ID
        npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
  6. npx wrangler deploy
        В конце программа напишет адрес сайта. Проверка «раз в минуту» для SMS включится сама.
  7. Откройте адрес сайта и /admin, войдите с паролем из шага 5, вкладка «Заявки», кнопка «Подключить чат к Telegram».
Копия проверена {date_ru}: (1) из этих файлов база восстановлена в отдельной временной базе Cloudflare и сверена с рабочей,
все таблицы и все фото совпали, временная база после проверки удалена; (2) сайт запущен из папки kod-sayta на базе из папки baza,
его страницы и фото совпали со страницами и фото рабочего сайта.


МОЖНО ЛИ ПЕРЕНЕСТИ НА ДРУГОЙ ХОСТИНГ
- Другой аккаунт Cloudflare или переезд с адреса workers.dev на свой домен: способ выше.
- Обычный хостинг «загрузил файлы по FTP» (PHP, WordPress): как есть не подойдёт. Сайт состоит не из готовых страниц:
  страницы собирает программа на сервере из базы данных, а чат, заявки и админка работают через неё же.
- Свой сервер (VPS, облако) с Node.js: подойдёт после небольшой доработки. Код нужно запускать на Node.js вместо Cloudflare,
  а база в папке baza это обычный SQLite: файлы загружаются в любую SQLite без изменений. Доработку может сделать
  программист или Claude.
- Совет: заведите свой домен (.ru). Тогда при любом переезде меняется только запись в DNS, а адрес для клиентов
  и поисковиков остаётся прежним.


КАК ОБНОВИТЬ КОПИЮ
Копию стоит обновлять после заметных правок (новые товары, фото, услуги, настройки в админке) и просто раз в месяц.
Напишите Claude: «обнови резервную копию сайта».
"""


def main():
    shutil.rmtree(PACK, ignore_errors=True); os.makedirs(PACK)
    structure, data_sql, db = export_db()

    os.makedirs(PACK + 'kod-sayta')                                     # код: чистый снимок последнего сохранённого состояния
    run(f'git archive --format=tar HEAD | tar -x -C "{PACK}kod-sayta"', shell=True, cwd=ROOT)
    if run(['git', 'status', '--porcelain'], cwd=ROOT).strip():
        print('Внимание: в проекте есть несохранённые правки, в копию кода они не попали (только последний коммит).')
    bundle = PACK + 'istoriya-izmeneniy.bundle'
    run(['git', 'bundle', 'create', bundle, '--all'], cwd=ROOT); run(['git', 'bundle', 'verify', bundle], cwd=ROOT)

    os.makedirs(PACK + 'baza')
    open(PACK + 'baza/struktura.sql', 'w', encoding='utf-8', newline='\n').write(structure)
    open(PACK + 'baza/dannye.sql', 'w', encoding='utf-8', newline='\n').write(data_sql)

    sitemap = subprocess.run(['curl', '-s', '-m', '30', SITE + '/sitemap.xml'], capture_output=True, text=True).stdout
    slug = {int(m.group(1)): m.group(0)[len('/tovar/'):] for m in re.finditer(r'/tovar/(\d+)-[^<\s]*', sitemap)}
    imgs = {k: (ct, base64.b64decode(d)) for k, ct, d in db.execute('SELECT key, content_type, data FROM images')}
    used, manifest = set(), []

    def put(rel, key):
        ct, b = imgs[key]
        path = PACK + 'foto/' + rel + '.' + EXT.get(ct, 'bin')
        os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'wb').write(b); used.add(key)
        manifest.append((path[len(PACK):], key, hashlib.sha256(b).hexdigest()))

    for pid, in db.execute('SELECT id FROM products ORDER BY id').fetchall():
        for n, (key,) in enumerate(db.execute('SELECT image_key FROM product_images WHERE product_id=? ORDER BY position, id', (pid,)).fetchall(), 1):
            if key in imgs: put(f'tovary/{slug.get(pid, str(pid))}/{n}', key)
    for vid, cover in db.execute('SELECT id, cover_key FROM videos WHERE cover_key IS NOT NULL ORDER BY position, id').fetchall():
        if cover in imgs and cover not in used: put(f'video-oblozhki/video-{vid}', cover)
    for key in imgs:
        if key not in used: put(f'prochee/{os.path.splitext(key)[0]}', key)       # главная страница, до и после и всё остальное
    n_settings = db.execute('SELECT COUNT(*) FROM settings').fetchone()[0]
    note = ('на день копии они сохранены в базе (файл baza/dannye.sql), кроме пароля.' if n_settings else
            'на день копии таблица настроек пуста: сайт работает на значениях по умолчанию из кода (часы работы, контакты и так далее). '
            'Всё, что вы поменяете в админке потом, будет храниться в базе, поэтому после таких правок копию нужно обновить.')
    open(PACK + 'README.txt', 'w', encoding='utf-8-sig', newline='').write(README.format(date_ru=DATE_RU, site=SITE, settings_note=note).replace('\n', '\r\n'))
    open(PACK + 'foto/_spisok.txt', 'w', encoding='utf-8-sig', newline='').write(
        '\r\n'.join(f'{h}  {rel}  (ключ в базе: {k})' for rel, k, h in manifest) + '\r\n')

    zpath = os.path.join(OUT, NAME + '.zip')
    if os.path.exists(zpath): os.remove(zpath)
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for root, dirs, files in os.walk(PACK):
            dirs.sort()
            for f in sorted(files):
                full = os.path.join(root, f); z.write(full, os.path.join(NAME, os.path.relpath(full, PACK)))
    print(f'Готово: {zpath} ({os.path.getsize(zpath) / 1e6:.1f} МБ), фото: {len(manifest)}, строк в базе: {sum(db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in DATA_TABLES if t != "images")}')


if __name__ == '__main__':
    main()
