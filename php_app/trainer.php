<?php
session_start();
require_once 'db.php';

if (!isset($_SESSION['trainer_id'])) { header('Location: index.php'); exit; }

$trainer_id = $_SESSION['trainer_id'];
$gym_id = $_SESSION['user_gym_id'];

// Get Gym Info
$stmt = $pdo->prepare("SELECT * FROM gyms WHERE id = ?");
$stmt->execute([$gym_id]);
$gym = $stmt->fetch();

// Get Trainer Info
$stmt = $pdo->prepare("SELECT * FROM trainers WHERE id = ?");
$stmt->execute([$trainer_id]);
$trainer = $stmt->fetch();

// Get All Members for the Roster
$stmt = $pdo->prepare("SELECT * FROM members WHERE gym_id = ? ORDER BY name ASC");
$stmt->execute([$gym_id]);
$members = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GymFlow | Trainer Tools</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .staff-label { font-size: 10px; font-weight: 800; color: var(--teal); background: rgba(29, 158, 117, 0.1); padding: 4px 10px; border-radius: 100px; display: inline-block; margin-bottom: 8px; }
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
                </div>
            </div>

            <div class="screen">
                <div class="s-header">
                    <div>
                        <div class="staff-label">STAFF CLEARANCE</div>
                        <div class="s-name">Coach <?php echo explode(' ', $trainer['name'])[0]; ?></div>
                    </div>
                    <div class="s-av" style="background: var(--teal); color: #fff;"><?php echo $trainer['initials']; ?></div>
                </div>

                <div class="hero-card" style="background: linear-gradient(135deg, #121214, #1e1e24); border: 1px solid var(--teal);">
                    <div class="hero-plan" style="color: var(--teal);"><?php echo strtoupper($gym['name']); ?> FACILITY</div>
                    <div class="hero-title">Next Assigned Session</div>
                    <div style="font-size: 24px; font-weight: 800; margin-top: 8px;">11:30 AM</div>
                    <div style="color: var(--t-tertiary); font-size: 13px;"><?php echo $trainer['specialty']; ?> Intake · Studio B</div>
                    <div style="display: flex; gap: 8px; margin-top: 16px;">
                        <button class="btn btn-acc" style="flex: 1; background: var(--teal); box-shadow: none;">Start Class</button>
                        <button class="btn" style="flex: 1;">Roster</button>
                    </div>
                </div>

                <div class="sec-title">Member Roster (<?php echo count($members); ?>)</div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <?php if (empty($members)): ?>
                        <div style="color: var(--t-tertiary); font-size: 13px; text-align: center; padding: 20px;">No members found in your fleet.</div>
                    <?php else: ?>
                        <?php foreach ($members as $m): ?>
                        <div class="cl-item">
                            <div class="s-av" style="height: 40px; width: 40px; font-size: 12px; margin-right: 12px;"><?php echo substr($m['name'],0,2); ?></div>
                            <div style="flex: 1;">
                                <div class="cl-name"><?php echo $m['name']; ?></div>
                                <div class="cl-trainer"><?php echo $m['plan']; ?> Plan</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 12px; font-weight: 800; color: var(--teal);"><?php echo $m['attendance']; ?> SESS</div>
                                <button class="btn" style="padding: 4px 8px; font-size: 9px; margin-top: 4px;" onclick="logAttendance('<?php echo $m['id']; ?>')">LOG</button>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Bottom Nav -->
            <div class="bottom-nav">
                <div class="bn-item on">
                    <div class="bn-icon"></div>
                    <div class="bn-lbl">Duty</div>
                </div>
                <div class="bn-item">
                    <div class="bn-icon"></div>
                    <div class="bn-lbl">Metrics</div>
                </div>
                <a href="actions.php?logout=1" class="bn-item" style="text-decoration:none;">
                    <div class="bn-icon"></div>
                    <div class="bn-lbl">Sign Out</div>
                </a>
            </div>
        </div>
    </div>

    <script>
        async function logAttendance(memberId) {
            const res = await fetch('actions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=log_attendance&member_id=${memberId}`
            });
            const data = await res.json();
            if (data.success) {
                alert('Attendance logged successfully!');
                location.reload();
            }
        }
    </script>
</body>
</html>
