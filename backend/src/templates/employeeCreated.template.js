module.exports = (name, email, tempPassword) => `
<!DOCTYPE html>
<html>
<body>
<h2>Welcome to GharKaPaisa Team</h2>
<p>Hello ${name},</p>
<p>An employee account has been created for you.</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Temporary Password:</strong> ${tempPassword}</p>
<p>Please log in and change your password immediately.</p>
</body>
</html>`;