<?php
session_start();
if (isset($_SESSION['gym_id'])) { header('Location: owner.php'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GymFlow | Owner Login</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .login-box { width: 100%; max-width: 400px; margin: 100px auto; padding: 40px; background: var(--g-surface); border: 1px solid var(--g-border); border-radius: 24px; }
        .lf-field { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
        .lf-field label { font-size: 11px; font-weight: 800; color: var(--t-tertiary); text-transform: uppercase; }
        .lf-field input { background: rgba(0,0,0,0.2); border: 1px solid var(--g-border); border-radius: 12px; padding: 14px; color: #fff; outline: none; transition: 0.3s; }
        .lf-field input:focus { border-color: var(--teal); }
        .lb-header { text-align: center; margin-bottom: 40px; }
        .lb-header h1 { font-family: 'Bebas Neue'; font-size: 32px; letter-spacing: 2px; }
        .lb-header h1 span { color: var(--acc); }
        .toggle-auth { text-align: center; margin-top: 20px; cursor: pointer; color: var(--t-secondary); font-size: 13px; }
    </style>
</head>
<body>
    <div class="mesh-bg"></div>
    <div class="login-box">
        <div class="lb-header">
            <h1>GymFlow <span>Pro</span></h1>
            <p id="pageDesc">Owner Command Protocol</p>
        </div>

        <form id="ownerForm">
            <input type="hidden" name="action" id="actionInp" value="login_gym">
            
            <div class="lf-field" id="gymNameField" style="display:none;">
                <label>Gym Name</label>
                <input type="text" name="gymName" placeholder="IronHaus Fitness">
            </div>

            <div class="lf-field">
                <label>Work Email</label>
                <input type="email" name="email" required placeholder="owner@ironhaus.de">
            </div>

            <div class="lf-field">
                <label>Admin Password</label>
                <input type="password" name="password" required placeholder="••••••••">
            </div>

            <div id="errorBox" style="color: #e94560; font-size: 13px; text-align: center; margin-bottom: 15px; display: none;"></div>

            <button type="submit" class="btn btn-acc" style="width: 100%; padding: 16px; font-size: 14px;">
                Enter Command Centre
            </button>
        </form>

        <div class="toggle-auth" id="toggleBtn">
            Don't have an account? Launch a new Gym.
        </div>
    </div>

    <script>
        const toggleBtn = document.getElementById('toggleBtn');
        const actionInp = document.getElementById('actionInp');
        const gymNameField = document.getElementById('gymNameField');
        const pageDesc = document.getElementById('pageDesc');
        const ownerForm = document.getElementById('ownerForm');
        let isLogin = true;

        toggleBtn.onclick = () => {
            isLogin = !isLogin;
            actionInp.value = isLogin ? 'login_gym' : 'register_gym';
            gymNameField.style.display = isLogin ? 'none' : 'flex';
            pageDesc.textContent = isLogin ? 'Owner Command Protocol' : 'Create New Gym Tenant';
            toggleBtn.textContent = isLogin ? "Don't have an account? Launch a new Gym." : "Already have a Gym? Log in here.";
            ownerForm.querySelector('button').textContent = isLogin ? 'Enter Command Centre' : 'Launch Setup Sequence';
        };

        ownerForm.onsubmit = async (e) => {
            e.preventDefault();
            const errorBox = document.getElementById('errorBox');
            errorBox.style.display = 'none';

            const response = await fetch('actions.php', { method: 'POST', body: new FormData(ownerForm) });
            const data = await response.json();

            if (data.success) {
                window.location.href = 'owner.php';
            } else {
                errorBox.textContent = data.error;
                errorBox.style.display = 'block';
            }
        };
    </script>
</body>
</html>
