const express = require('express');
const crypto = require('crypto');
const http = require('http');

const green = text => `\x1b[32m${text}\x1b[0m`;
const red = text => `\x1b[31m${text}\x1b[0m`;

async function runExpressWebhookIntegrationTest() {
  console.log('--- TEST 10: Express HTTP Pipeline Integration Test (req.rawBody HMAC Signature Verification) ---');

  const app = express();
  const secret = 'test_webhook_secret_999';

  // Exact Express body parser middleware configuration from server.js
  app.use(express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  }));

  // Mount test webhook endpoint simulating wallet controller webhook handler
  app.post('/api/v1/wallet/razorpay-payout-webhook', (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;

    if (!rawBody) {
      return res.status(400).json({ error: 'Missing rawBody' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid HMAC signature' });
    }

    const body = req.body;
    return res.status(200).json({ status: 'success', event: body.event, rawBodyCaptured: true });
  });

  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Test Express server running on port ${port}...`);

    const payload = JSON.stringify({
      event: 'payout.processed',
      event_id: 'evt_express_test_100',
      payload: { payout: { entity: { id: 'pout_exp_100', amount: 50000 } } }
    });

    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/api/v1/wallet/razorpay-payout-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const responseBody = JSON.parse(data);
        console.log('HTTP Response Status:', res.statusCode);
        console.log('HTTP Response Body:', responseBody);

        if (res.statusCode === 200 && responseBody.status === 'success' && responseBody.rawBodyCaptured) {
          console.log(green('✅ TEST 10 PASSED: Express req.rawBody middleware correctly captured raw payload & HMAC signature verified via real HTTP request!\n'));
        } else {
          console.log(red('❌ TEST 10 FAILED!\n'));
        }
        server.close();
      });
    });

    req.on('error', (err) => {
      console.error(red('HTTP Request Error:'), err.message);
      server.close();
    });

    req.write(payload);
    req.end();
  });
}

runExpressWebhookIntegrationTest().catch(err => console.error(err));
