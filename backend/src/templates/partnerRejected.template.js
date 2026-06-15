module.exports = (name, reason) => `
<!DOCTYPE html>
<html>
<body>
<h2>Partner Account Rejected</h2>
<p>Hello ${name},</p>
<p>We regret to inform you that your Partner registration has been rejected.</p>
<p><strong>Reason:</strong> ${reason}</p>
</body>
</html>`;