module.exports = (name, applicationId, reason) => `
<!DOCTYPE html>
<html>
<body>
<h2>Application Rejected</h2>
<p>Hello ${name},</p>
<p>Application ID: ${applicationId}</p>
<p><strong>Reason:</strong></p>
<p>${reason}</p>
</body>
</html>`;