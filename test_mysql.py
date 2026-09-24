import mysql.connector

print("1. Python mulai")

try:

    print("2. Mencoba koneksi...")

    db = mysql.connector.connect(
        host="localhost",
        port=3306,
        user="root",
        password="PasswordBaru123!",
        database="musholla_finance",
        connection_timeout=10
    )

    print("3. BERHASIL TERHUBUNG!")

    cursor = db.cursor()

    cursor.execute("SELECT USER(), DATABASE()")

    result = cursor.fetchone()

    print("4. User:", result[0])
    print("5. Database:", result[1])

    cursor.execute("""
        SELECT COUNT(*)
        FROM transactions
    """)

    count = cursor.fetchone()[0]

    print("6. Jumlah transaksi:", count)

    cursor.close()
    db.close()

    print("7. SELESAI")

except Exception as e:

    print("ERROR TERJADI")
    print("Jenis error:", type(e).__name__)
    print("Pesan:", str(e))
