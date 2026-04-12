<?php
// GymFlow Core Database connection (SQLite for universal shared hosting compatibility)
$db_file = __DIR__ . '/gymflow.db';

try {
    $pdo = new PDO("sqlite:" . $db_file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Initialize Schema if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS gyms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        location TEXT,
        classes_visible INTEGER DEFAULT 0,
        brand_color TEXT DEFAULT '#e94560',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        gym_id TEXT,
        name TEXT,
        plan TEXT,
        access_code TEXT,
        attendance INTEGER DEFAULT 0,
        goal_progress INTEGER DEFAULT 0,
        joined_date TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(gym_id) REFERENCES gyms(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS trainers (
        id TEXT PRIMARY KEY,
        gym_id TEXT,
        name TEXT,
        specialty TEXT,
        initials TEXT,
        access_code TEXT,
        status TEXT DEFAULT 'online',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(gym_id) REFERENCES gyms(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        gym_id TEXT,
        name TEXT,
        trainer_name TEXT,
        time TEXT,
        booked INTEGER DEFAULT 0,
        capacity INTEGER DEFAULT 20,
        color TEXT,
        FOREIGN KEY(gym_id) REFERENCES gyms(id)
    )");

} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>
