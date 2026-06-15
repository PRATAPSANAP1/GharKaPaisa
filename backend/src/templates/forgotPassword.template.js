module.exports = (name, resetLink) => `
<!DOCTYPE html>
<html>
<body>
<h2>Password Reset</h2>
<p>Hello ${name},</p>
<p>Click below to reset your password:</p>
<a href="${resetLink}">Reset Password</a>
<p>This link expires in 30 minutes.</p>
</body>
</html>`;