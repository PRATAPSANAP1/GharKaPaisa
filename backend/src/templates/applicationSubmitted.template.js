module.exports = (name, applicationId) => `
<!DOCTYPE html>
<html>
<body>
<h2>Application Submitted Successfully</h2>
<p>Hello ${name},</p>
<p>Your application (ID: ${applicationId}) has been received.</p>
<p>We are reviewing it and will update you shortly.</p>
</body>
</html>`;