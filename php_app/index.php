<?php
session_start();
// Redirect already logged in users
if (isset($_SESSION['member_id'])) { header('Location: member.php'); exit; }
if (isset($_SESSION['trainer_id'])) { header('Location: trainer.php'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GymFlow ID | Universal Portal</title>
    <link rel="stylesheet" href="css/style.css">
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
                <div class="portal-wrap">
                    <div class="portal-icon">⌘</div>
                    <h2 class="portal-title">GymFlow ID</h2>
                    <p class="portal-desc">
                        Universal access portal. Please enter your 4-digit facility clearance code.
                    </p>

                    <form id="portalForm" class="portal-form">
                        <input type="hidden" name="action" value="verify_portal">
                        <input 
                            name="code"
                            type="text" 
                            maxlength="4" 
                            placeholder="••••" 
                            class="portal-input"
                            id="codeField"
                            required
                        >
                        <div id="errorBox" style="color: #e94560; font-size: 14px; font-weight: bold; margin-top: 10px; display: none;"></div>
                        
                        <button type="submit" class="btn btn-acc" style="width: 100%; border-radius: 16px; padding: 20px; font-size: 18px; margin-top: 20px;">
                            Access Terminal
                        </button>
                    </form>
                </div>

                <div style="text-align: center; font-size: 11px; color: var(--t-tertiary); opacity: 0.5; margin-top: 40px;">
                    GymFlow PHP-SaaS Engine v1.0
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('portalForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const errorBox = document.getElementById('errorBox');
            errorBox.style.display = 'none';

            try {
                const response = await fetch('actions.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.type === 'member') {
                    window.location.href = 'member.php';
                } else if (data.type === 'trainer') {
                    window.location.href = 'trainer.php';
                } else {
                    errorBox.textContent = data.error || 'Identity verification failed.';
                    errorBox.style.display = 'block';
                }
            } catch (err) {
                errorBox.textContent = 'Server connection error.';
                errorBox.style.display = 'block';
            }
        });

        // Numeric only for input
        document.getElementById('codeField').addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g,'');
        });
    </script>
</body>
</html>
