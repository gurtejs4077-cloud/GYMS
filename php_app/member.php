<?php
session_start();
require_once 'db.php';

if (!isset($_SESSION['member_id'])) { header('Location: index.php'); exit; }

$member_id = $_SESSION['member_id'];
$gym_id = $_SESSION['user_gym_id'];

// Get Gym Settings
$stmt = $pdo->prepare("SELECT * FROM gyms WHERE id = ?");
$stmt->execute([$gym_id]);
$gym = $stmt->fetch();

// Get Member Info
$stmt = $pdo->prepare("SELECT * FROM members WHERE id = ?");
$stmt->execute([$member_id]);
$user = $stmt->fetch();

// Get Classes
$stmt = $pdo->prepare("SELECT * FROM classes WHERE gym_id = ? ORDER BY time ASC");
$stmt->execute([$gym_id]);
$classes = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GymFlow | My Progress</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        /* Mobile specific enhancements */
        .member-app { background: var(--bg-dark); min-height: 100vh; display: flex; flex-direction: column; }
    </style>
</head>
<body>
    <div class="phone-container">
        <div class="phone">
            <!-- Notch -->
            <div class="phone-notch">
                <span class="notch-time"><?php echo date('H:i'); ?></span>
                <div class="notch-icons">
                    <div class="notch-dot"></div>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><rect x="0" y="5" width="2" height="5" rx="1" fill="#fff"/><rect x="3" y="3" width="2" height="7" rx="1" fill="#fff"/><rect x="6" y="1" width="2" height="9" rx="1" fill="#fff"/></svg>
                </div>
            </div>

            <div class="screen">
                <div class="s-header">
                    <div>
                        <div class="s-greet">Good morning</div>
                        <div class="s-name"><?php echo $user['name']; ?></div>
                    </div>
                    <div class="s-av"><?php echo substr($user['name'], 0, 2); ?></div>
                </div>

                <div class="hero-card">
                    <div class="hero-plan"><?php echo strtoupper($gym['name']); ?> · <?php echo strtoupper($user['plan']); ?> FLEET</div>
                    <div class="hero-title">Your Current Standing</div>
                    <div class="hero-row">
                        <div>
                            <div class="hero-stat-v"><?php echo $user['attendance']; ?></div>
                            <div class="hero-stat-l">SESSIONS</div>
                        </div>
                        <div style="width: 1px; height: 30px; background: rgba(255,255,255,0.2);"></div>
                        <div>
                            <div class="hero-stat-v"><?php echo $user['goal_progress']; ?>%</div>
                            <div class="hero-stat-l">GOAL</div>
                        </div>
                        <button class="hero-btn">Renew</button>
                    </div>
                </div>

                <div class="sec-title">Available Classes</div>
                <div class="class-list">
                    <?php if (empty($classes)): ?>
                        <div style="color: var(--t-tertiary); font-size: 13px; text-align: center; padding: 20px;">No classes scheduled for today.</div>
                    <?php else: ?>
                        <?php foreach ($classes as $c): ?>
                        <div class="cl-item">
                            <div style="min-width: 65px;">
                                <div class="cl-time"><?php echo explode(' ', $c['time'])[0]; ?></div>
                                <div class="cl-ampm"><?php echo explode(' ', $c['time'])[1]; ?></div>
                            </div>
                            <div style="flex: 1;">
                                <div class="cl-name"><?php echo $c['name']; ?></div>
                                <div class="cl-trainer"><?php echo $c['trainer_name']; ?></div>
                            </div>
                            <button class="cl-book">Book</button>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <div class="sec-title">Performance Analytics</div>
                <div class="prog-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="prog-pct">78%</div>
                        <div style="text-align: right; font-size: 10px; font-weight: 700;">
                            <span style="color: var(--acc);">Active Streak</span><br>
                            <span style="color: var(--t-tertiary);">Next Rank: Alpha</span>
                        </div>
                    </div>
                    <div class="prog-metrics">
                        <div class="pm">
                            <div class="pm-v">12k</div>
                            <div class="pm-l">CALS</div>
                        </div>
                        <div class="pm">
                            <div class="pm-v">14</div>
                            <div class="pm-l">HRS</div>
                        </div>
                        <div class="pm">
                            <div class="pm-v">82</div>
                            <div class="pm-l">BPM</div>
                        </div>
                    </div>
                    <div class="prog-bar-wrap">
                        <div class="prog-bar-fill" style="width: 78%;"></div>
                    </div>
                </div>
            </div>

            <!-- Bottom Nav -->
            <div class="bottom-nav">
                <div class="bn-item on">
                    <div class="bn-icon"></div>
                    <div class="bn-lbl">Home</div>
                </div>
                <div class="bn-item">
                    <div class="bn-icon"></div>
                    <div class="bn-lbl">Train</div>
                </div>
                <div class="bn-item">
                    <div class="bn-icon"></div>
                    <div class="bn-lbl">Goals</div>
                </div>
                <a href="actions.php?logout=1" class="bn-item" style="text-decoration:none;">
                    <div class="bn-icon" style="background: rgba(233, 69, 96, 0.1);"></div>
                    <div class="bn-lbl">Exit</div>
                </a>
            </div>
        </div>
    </div>
</body>
</html>
