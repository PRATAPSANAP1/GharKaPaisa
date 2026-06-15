module.exports = (name, amount, applicationId) => `
<!DOCTYPE html>
<html>
<body>
<h2>Commission Released</h2>
<p>Hello ${name},</p>
<p>Your commission has been released.</p>
<p>Application ID: ${applicationId}</p>
<p>Commission Amount: ₹${amount}</p>
</body>
</html>`;