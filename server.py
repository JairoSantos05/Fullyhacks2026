from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import sqlite3
import json

app = FastAPI()

def init_db():
    conn = sqlite3.connect("deepsea.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_states (
            username TEXT PRIMARY KEY,
            state_data TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.get("/api/state/{username}")
def get_state(username: str):
    conn = sqlite3.connect("deepsea.db")
    cursor = conn.cursor()
    cursor.execute('SELECT state_data FROM user_states WHERE username = ?', (username,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return JSONResponse(content={"state": json.loads(row[0])})
    return JSONResponse(content={"state": None})

@app.post("/api/state/{username}")
async def save_state(username: str, request: Request):
    data = await request.json()
    conn = sqlite3.connect("deepsea.db")
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO user_states (username, state_data)
        VALUES (?, ?)
        ON CONFLICT(username) DO UPDATE SET state_data=excluded.state_data
    ''', (username, json.dumps(data.get("state", {}))))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.delete("/api/state/{username}")
def delete_state(username: str):
    conn = sqlite3.connect("deepsea.db")
    cursor = conn.cursor()
    cursor.execute('DELETE FROM user_states WHERE username = ?', (username,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

@app.get("/api/leaderboard")
def get_leaderboard():
    conn = sqlite3.connect("deepsea.db")
    cursor = conn.cursor()
    cursor.execute('SELECT username, state_data FROM user_states')
    rows = cursor.fetchall()
    conn.close()
    board = []
    for username, state_data in rows:
        try:
            s = json.loads(state_data)
            board.append({"username": username, "xp": s.get("xp", 0), "streak": s.get("streak", 0)})
        except:
            pass
    board.sort(key=lambda x: x["xp"], reverse=True)
    return JSONResponse(content={"leaderboard": board})


@app.get("/", response_class=HTMLResponse)
@app.get("/index.html", response_class=HTMLResponse)
def serve_app():
    with open("index.html", "r") as file:
        return file.read()

@app.get("/adaptiveSystem.js")
def serve_js():
    return FileResponse("adaptiveSystem.js", media_type="application/javascript")

@app.get("/manifest.json")
def serve_manifest():
    return FileResponse("manifest.json", media_type="application/manifest+json")

@app.get("/sw.js")
def serve_sw():
    return FileResponse("sw.js", media_type="application/javascript")

if os.path.exists("assets"):
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")

@app.get("/ping")
def ping():
    return {"status": "Deep Sea Server is alive!"}
