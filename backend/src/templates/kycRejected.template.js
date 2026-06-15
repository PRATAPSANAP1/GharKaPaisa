module.exports = (name, reason) => `
<!DOCTYPE html>
<html>
<body>
<h2>KYC Rejected</h2>
<p>Hello ${name},</p>
<p>Your KYC request has been rejected.</p>
<p><strong>Reason:</strong></p>
<p>${reason}</p>
<p>Please update and resubmit.</p>
</body>
</html>`;