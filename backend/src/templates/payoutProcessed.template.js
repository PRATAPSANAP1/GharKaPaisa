module.exports = (name, amount, transactionId) => `
<!DOCTYPE html>
<html>
<body>
<h2>Payout Processed</h2>
<p>Hello ${name},</p>
<p>A payout of ₹${amount} has been successfully processed to your bank account.</p>
<p>Transaction ID: ${transactionId}</p>
</body>
</html>`;