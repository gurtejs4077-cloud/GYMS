<?php
session_start();
require_once 'db.php';

if (!isset($_SESSION['gym_id'])) { header('Location: login.php'); exit; }

$gym_id = $_SESSION['gym_id'];

// Get Gym Info
$stmt = $pdo->prepare("SELECT * FROM gyms WHERE id = ?");
$stmt->execute([$gym_id]);
$gym = $stmt->fetch();

// Get Members
$stmt = $pdo->prepare("SELECT * FROM members WHERE gym_id = ? ORDER BY created_at DESC");
$stmt->execute([$gym_id]);
$members = $stmt->fetchAll();

// Get Trainers
$stmt = $pdo->prepare("SELECT * FROM trainers WHERE gym_id = ? ORDER BY created_at DESC");
$stmt->execute([$gym_id]);
$trainers = $stmt->fetchAll();

// Get Classes
$stmt = $pdo->prepare("SELECT * FROM classes WHERE gym_id = ? ORDER BY time ASC");
$stmt->execute([$gym_id]);
$classes = $stmt->fetchAll();

$activeTab = $_GET['tab'] ?? 'Overview';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GymFlow | Admin Command Centre</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body style="background: var(--g-dark);">
    <div class="mesh-bg"></div>
    <div class="shell-wrapper">
        <div class="shell">
            <div class="topbar">
                <div class="tb-brand">
                    <div class="brand-icon">
                        <svg width="24" height="24" viewBox="0 0 18 18" fill="none"><rect x="1" y="7" width="4" height="4" rx="1" fill="#fff"/><rect x="13" y="7" width="4" height="4" rx="1" fill="#fff"/><rect x="5" y="5" width="8" height="8" rx="2" fill="#fff"/><rect x="7" y="2" width="4" height="14" rx="1" fill="#fff" opacity=".5"/></svg>
                    </div>
                    <div class="brand-name">GymFlow <span>Pro</span></div>
                </div>
                <div class="tb-nav">
                    <a href="?tab=Overview" class="tb-tab <?php echo $activeTab=='Overview'?'on':''; ?>">Overview</a>
                    <a href="?tab=Members" class="tb-tab <?php echo $activeTab=='Members'?'on':''; ?>">Members</a>
                    <a href="?tab=Trainers" class="tb-tab <?php echo $activeTab=='Trainers'?'on':''; ?>">Trainers</a>
                    <a href="?tab=Settings" class="tb-tab <?php echo $activeTab=='Settings'?'on':''; ?>">Settings</a>
                </div>
                <div class="tb-right">
                    <div class="gym-tag">TENANT: <?php echo strtoupper($gym['name']); ?></div>
                    <div class="av">AD</div>
                </div>
            </div>

            <div class="body">
                <div class="sidebar">
                    <div class="sg-lbl">Control Deck</div>
                    <div class="si on">Broadcast View <div class="sb sb-g">Live</div></div>
                    <div class="si">Facility Access <div class="sb sb-a">2 Open</div></div>
                    <div class="si">Revenue Ops</div>
                    
                    <div class="sg-lbl">Security</div>
                    <div class="si">Firewall Status <div class="sb sb-g">Locked</div></div>
                    <a href="actions.php?logout=1" style="text-decoration:none; margin-top:auto;"><div class="si" style="color:var(--acc);">Log Out System</div></a>
                </div>

                <div class="content">
                    <?php if ($activeTab == 'Overview'): ?>
                        <div class="pg-head">
                            <div>
                                <h1 class="pg-title">Command Centre</h1>
                                <p class="pg-sub">Real-time gym performance and multi-tenant telemetry.</p>
                            </div>
                            <button class="btn btn-acc" onclick="openModal('addMemberModal')">+ Add New Fleet Member</button>
                        </div>

                        <div class="kpis">
                            <div class="kpi">
                                <div class="kpi-l">TOTAL REVENUE (MRR)</div>
                                <div class="kpi-v">$12,482</div>
                                <div class="kpi-d up">+8.2% <span style="color:var(--t-tertiary)">vs last month</span></div>
                            </div>
                            <div class="kpi">
                                <div class="kpi-l">ACTIVE MEMBERS</div>
                                <div class="kpi-v"><?php echo count($members); ?></div>
                                <div class="kpi-d up">+12 <span style="color:var(--t-tertiary)">new this week</span></div>
                            </div>
                            <div class="kpi">
                                <div class="kpi-l">STAFF ONLINE</div>
                                <div class="kpi-v"><?php echo count($trainers); ?></div>
                                <div class="kpi-d" style="color:var(--blue)">3 Active Shifts</div>
                            </div>
                        </div>

                        <div class="row2">
                            <div class="card">
                                <div class="ct">Active Roster <span class="ct-action">Show All</span></div>
                                <div class="member-mini-list">
                                    <?php foreach (array_slice($members, 0, 5) as $m): ?>
                                    <div class="m-mini-item">
                                        <div class="m-av"><?php echo substr($m['name'], 0, 2); ?></div>
                                        <div style="flex:1">
                                            <div class="m-name"><?php echo $m['name']; ?></div>
                                            <div class="m-sub"><?php echo $m['plan']; ?> Plan · Joined <?php echo $m['joined_date']; ?></div>
                                        </div>
                                        <div class="m-stat-tag <?php echo $m['attendance']<30?'at-risk':'active'; ?>">
                                            CODE: <?php echo $m['access_code']; ?>
                                        </div>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>

                            <div class="card">
                                <div class="ct">Live Schedule</div>
                                <div class="sched-grid">
                                    <?php foreach ($classes as $c): ?>
                                    <div class="sc-item">
                                        <div class="sc-time"><?php echo explode(' ', $c['time'])[0]; ?></div>
                                        <div style="flex:1">
                                            <div class="sc-name"><?php echo $c['name']; ?></div>
                                            <div class="sc-trainer">Coach <?php echo $c['trainer_name']; ?></div>
                                        </div>
                                        <div style="width: 60px;">
                                            <div class="sc-fill-wrap">
                                                <div class="sc-fill" style="width: <?php echo ($c['booked']/$c['capacity'])*100; ?>%; background: <?php echo $c['color']; ?>"></div>
                                            </div>
                                            <div class="sc-cap"><?php echo $c['booked']; ?>/<?php echo $c['capacity']; ?></div>
                                        </div>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal for adding member -->
    <div id="addMemberModal" class="modal-overlay" style="display:none;">
        <div class="modal">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <h2 style="font-family:'Bebas Neue'; font-size:24px;">Provision New Member</h2>
                <span class="close" onclick="closeModal('addMemberModal')">×</span>
            </div>
            <form id="addMemberForm" class="settings-form">
                <input type="hidden" name="action" value="add_member">
                <div class="field">
                    <label>Full Legal Name</label>
                    <input type="text" name="name" required placeholder="John Connor">
                </div>
                <div class="field">
                    <label>Subscription Tier</label>
                    <select name="plan">
                        <option>Basic</option>
                        <option>Pro</option>
                        <option>Elite</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-acc" style="width:100%; margin-top:20px; padding:16px;">Generate Access Code</button>
            </form>
        </div>
    </div>

    <script>
        function openModal(id) { document.getElementById(id).style.display = 'flex'; }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }

        document.getElementById('addMemberForm').onsubmit = async (e) => {
            e.preventDefault();
            const res = await fetch('actions.php', { method: 'POST', body: new FormData(e.target) });
            const data = await res.json();
            if (data.success) {
                alert('Member added! Access Code: ' + data.code);
                location.reload();
            }
        };
    </script>
</body>
</html>
