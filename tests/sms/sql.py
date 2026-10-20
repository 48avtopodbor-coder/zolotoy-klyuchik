import sqlite3, sys, json
db, q = sys.argv[1], sys.argv[2]
args = json.loads(sys.argv[3]) if len(sys.argv) > 3 else []
con = sqlite3.connect(db, timeout=15)
con.row_factory = sqlite3.Row
cur = con.execute(q, args)
rows = [dict(r) for r in cur.fetchall()] if cur.description else []
con.commit()
print(json.dumps(rows, ensure_ascii=False))
