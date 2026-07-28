// Admin Login Handler
const loginForm = document.getElementById('admin-login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');

    try {
      // Firebase Sign-In
      await signInWithEmailAndPassword(auth, email, password);
      
      // Hide Login Card & Show Dashboard
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('dashboard-section').style.display = 'block';
    } catch (error) {
      if (errorMsg) {
        errorMsg.textContent = "Invalid email or password. Please try again.";
      }
      console.error("Login Error:", error.message);
    }
  });
}
