module.exports = (name, applicationId, amount) => `
<!DOCTYPE html>
<html>
<body>
<h2>Disbursement Completed</h2>
<p>Hello ${name},</p>
<p>The loan for application ${applicationId} has been successfully disbursed.</p>
<p>Disbursed Amount: ₹${amount}</p>
</body>
</html>`;