module.exports = (name, email, tempPassword) => `
<!DOCTYPE html>
<html>
<body>
<h2>Agent Account Created</h2>
<p>Hello ${name},</p>
<p>Your Agent account has been successfully created.</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Temporary Password:</strong> ${tempPassword}</p>
<p>Please log in and begin your operations.</p>
</body>
</html>`;