module.exports = (name, amount, balance) => `
<!DOCTYPE html>
<html>
<body>
<h2>Wallet Credited</h2>
<p>Hello ${name},</p>
<p>₹${amount} has been credited.</p>
<p>Current Balance: ₹${balance}</p>
</body>
</html>`;