module.exports = (name, applicationId, amount) => `
<!DOCTYPE html>
<html>
<body>
<h2>Application Approved</h2>
<p>Hello ${name},</p>
<p>Your application has been approved.</p>
<p>Application ID: ${applicationId}</p>
<p>Amount: ₹${amount}</p>
</body>
</html>`;