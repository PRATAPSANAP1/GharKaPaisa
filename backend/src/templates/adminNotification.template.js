module.exports = (adminName, title, message) => `
<!DOCTYPE html>
<html>
<body>
<h2>System Notification: ${title}</h2>
<p>Hello ${adminName},</p>
<p>${message}</p>
</body>
</html>`;