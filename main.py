from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mysql.connector import pooling
from typing import Optional
from datetime import date
from dotenv import load_dotenv

import os

load_dotenv()

app = FastAPI(title="Musholla Finance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# DATABASE
# ==========================================

db_pool = pooling.MySQLConnectionPool(
    pool_name="musholla_pool",
    pool_size=5,

    host=os.environ.get("DB_HOST"),
    port=int(os.environ.get("DB_PORT") or "3306"),
    user=os.environ.get("DB_USER"),
    password=os.environ.get("DB_PASSWORD"),
    database=os.environ.get("DB_NAME"),

    autocommit=True,
    use_pure=True,
)




def get_db():
    return db_pool.get_connection()


# ==========================================
# MODEL
# ==========================================

class TransactionRequest(BaseModel):
    type: str
    category: str
    amount: float
    transaction_date: str
    note: Optional[str] = ""

class TransactionUpdate(BaseModel):
    type: str
    category: str
    amount: float
    transaction_date: str
    note: Optional[str] = ""




# ==========================================
# TEST
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Musholla Finance API berjalan"
    }


@app.get("/api/test")
def test():
    return {
        "success": True,
        "message": "Backend berhasil!"
    }


# ==========================================
# GET SEMUA TRANSAKSI
# ==========================================

@app.get("/api/transactions")
def get_transactions():

    db = get_db()

    try:
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
    id,
    type,
    category,
    amount,
    transaction_date,
    note
FROM transactions

            ORDER BY transaction_date DESC, id DESC
        """)

        return cursor.fetchall()

    finally:
        db.close()


# ==========================================
# TAMBAH TRANSAKSI
# ==========================================

@app.post("/api/transactions")
def create_transaction(request: TransactionRequest):

    if request.type not in ["pemasukan", "pengeluaran"]:
        raise HTTPException(
            status_code=400,
            detail="type harus pemasukan atau pengeluaran"
        )

    if request.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="amount harus lebih dari 0"
        )

    db = get_db()

    try:
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO transactions
(type, category, amount, transaction_date, note)
VALUES (%s, %s, %s, %s, %s)

        """, (
    request.type,
    request.category,
    request.amount,
    request.transaction_date,
    request.note
))

        return {
            "success": True,
            "message": "Transaksi berhasil ditambahkan",
            "id": cursor.lastrowid
        }

    finally:
        db.close()

@app.put("/api/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    request: TransactionUpdate
):

    if request.type not in ["pemasukan", "pengeluaran"]:
        raise HTTPException(
            status_code=400,
            detail="type harus pemasukan atau pengeluaran"
        )

    if request.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="amount harus lebih dari 0"
        )

    db = get_db()

    try:
        cursor = db.cursor()

        cursor.execute("""
            UPDATE transactions
            SET
                type = %s,
                category = %s,
                amount = %s,
                transaction_date = %s,
                note = %s
            WHERE id = %s
        """, (
            request.type,
            request.category,
            request.amount,
            request.transaction_date,
            request.note,
            transaction_id
        ))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Transaksi tidak ditemukan"
            )

        return {
            "success": True,
            "message": "Transaksi berhasil diperbarui"
        }

    finally:
        db.close()

# ==========================================
# HAPUS TRANSAKSI
# ==========================================

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):

    db = get_db()

    try:
        cursor = db.cursor()

        cursor.execute("""
            DELETE FROM transactions
            WHERE id = %s
        """, (transaction_id,))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Transaksi tidak ditemukan"
            )

        return {
            "success": True,
            "message": "Transaksi berhasil dihapus"
        }

    finally:
        db.close()


# ==========================================
# SUMMARY / SALDO
# ==========================================

@app.get("/api/summary")
def get_summary():

    db = get_db()

    try:
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'pemasukan'
                            THEN amount
                            ELSE 0
                        END
                    ), 0
                ) AS total_pemasukan,

                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'pengeluaran'
                            THEN amount
                            ELSE 0
                        END
                    ), 0
                ) AS total_pengeluaran

            FROM transactions
        """)

        result = cursor.fetchone()

        total_pemasukan = float(result["total_pemasukan"])
        total_pengeluaran = float(result["total_pengeluaran"])

        saldo = total_pemasukan - total_pengeluaran

        return {
            "total_pemasukan": total_pemasukan,
            "total_pengeluaran": total_pengeluaran,
            "saldo": saldo
        }

    finally:
        db.close()
