<?php
session_start();
require_once 'db.php';

// Helper: Response JSON
function json_response($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Logic: Register Gym
if (isset($_POST['action']) && $_POST['action'] == 'register_gym') {
    $email = $_POST['email'];
    $password = $_POST['password'];
    $name = $_POST['gymName'];
    $id = 'gym-' . bin2hex(random_bytes(4));

    try {
        $stmt = $pdo->prepare("INSERT INTO gyms (id, name, email, password) VALUES (?, ?, ?, ?)");
        $stmt->execute([$id, $name, $email, $password]);
        
        $_SESSION['gym_id'] = $id;
        json_response(['success' => true, 'gym_id' => $id]);
    } catch (Exception $e) {
        json_response(['error' => 'Email already registered.']);
    }
}

// Logic: Login Gym
if (isset($_POST['action']) && $_POST['action'] == 'login_gym') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT id FROM gyms WHERE email = ? AND password = ?");
    $stmt->execute([$email, $password]);
    $gym = $stmt->fetch();

    if ($gym) {
        $_SESSION['gym_id'] = $gym['id'];
        json_response(['success' => true, 'gym_id' => $gym['id']]);
    } else {
        json_response(['error' => 'Invalid credentials.']);
    }
}

// Logic: Universal Token Verification (Portal)
if (isset($_POST['action']) && $_POST['action'] == 'verify_portal') {
    $code = $_POST['code'];

    // Check Members
    $stmt = $pdo->prepare("SELECT id, name, gym_id FROM members WHERE access_code = ?");
    $stmt->execute([$code]);
    $member = $stmt->fetch();

    if ($member) {
        $_SESSION['member_id'] = $member['id'];
        $_SESSION['user_gym_id'] = $member['gym_id'];
        json_response(['type' => 'member', 'id' => $member['id'], 'gym_id' => $member['gym_id']]);
    }

    // Check Trainers
    $stmt = $pdo->prepare("SELECT id, name, gym_id FROM trainers WHERE access_code = ?");
    $stmt->execute([$code]);
    $trainer = $stmt->fetch();

    if ($trainer) {
        $_SESSION['trainer_id'] = $trainer['id'];
        $_SESSION['user_gym_id'] = $trainer['gym_id'];
        json_response(['type' => 'trainer', 'id' => $trainer['id'], 'gym_id' => $trainer['gym_id']]);
    }

    json_response(['error' => 'Invalid Access Code.']);
}

// Logic: Add Member
if (isset($_POST['action']) && $_POST['action'] == 'add_member' && isset($_SESSION['gym_id'])) {
    $name = $_POST['name'];
    $plan = $_POST['plan'];
    $gym_id = $_SESSION['gym_id'];
    $id = 'm-' . bin2hex(random_bytes(4));
    $code = (string)rand(1000, 9999);
    $joined = date('M Y');

    $stmt = $pdo->prepare("INSERT INTO members (id, gym_id, name, plan, access_code, joined_date) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $gym_id, $name, $plan, $code, $joined]);
    
    json_response(['success' => true, 'code' => $code]);
}
// Logic: Log Attendance (Trainer only)
if (isset($_POST['action']) && $_POST['action'] == 'log_attendance' && isset($_SESSION['trainer_id'])) {
    $member_id = $_POST['member_id'];
    $stmt = $pdo->prepare("UPDATE members SET attendance = attendance + 1 WHERE id = ?");
    $stmt->execute([$member_id]);
    json_response(['success' => true]);
}

// Logic: Log Out
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: login.php');
    exit;
}
?>
