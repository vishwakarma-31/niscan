const pdfParse = require('pdf-parse');
const policyRepository = require('../repositories/policyRepository');
const { getIO } = require('../config/socket');
const { sendPolicyCreatedEmail } = require('./emailService');
const { getPresignedUrl } = require('../config/s3');


async function extractPolicyData(policyId, pdfBuffer) {
  console.log(`starting extraction for policy ${policyId}`);

  let extractedText = '';

  // get text from pdf
  try {
    const pdfData = await pdfParse(pdfBuffer);
    extractedText = pdfData.text?.trim() || '';
    console.log(`got pdf text (${extractedText.length} chars)`);
  } catch (err) {
    console.error(`pdf-parse failed:`, err.message);
    // keep going even if empty
  }

  // use chatgpt to get the fields
  const openai = new (require('openai').OpenAI)({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let extractionResult;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content:
            'You are an insurance document parser. Extract key fields from insurance policy PDFs and return ONLY a valid JSON object with no markdown, no explanation, no preamble.',
        },
        {
          role: 'user',
          content: `Extract the following fields from this insurance policy document. For each field return the extracted value and a confidence score between 0 and 1 (1.0 = certain, 0.0 = not found).

Return ONLY this JSON structure:
{
  "policy_number": { "value": "string or null", "confidence": 0.0 },
  "customer_name": { "value": "string or null", "confidence": 0.0 },
  "vehicle_number": { "value": "string or null", "confidence": 0.0 },
  "insurer_name": { "value": "string or null", "confidence": 0.0 },
  "premium_amount": { "value": "string or null", "confidence": 0.0 }
}

For premium_amount, extract the total premium including GST as a numeric string (digits only, no currency symbols).

Document content:
${extractedText || '[No text extracted from PDF — please analyze the document structure directly]'}`, // eslint-disable-line no-useless-escape
        },
      ],
    });

    const rawText = completion.choices[0]?.message?.content || '{}';

  // parse json safely
    try {
      extractionResult = JSON.parse(rawText);
    } catch {
      console.error(`json parse failed`);
      extractionResult = {
        policy_number: { value: null, confidence: 0.1 },
        customer_name: { value: null, confidence: 0.1 },
        vehicle_number: { value: null, confidence: 0.1 },
        insurer_name: { value: null, confidence: 0.1 },
        premium_amount: { value: null, confidence: 0.1 },
        _parse_error: rawText.substring(0, 500),
      };
    }

    console.log(`extraction done for ${policyId}`);
  } catch (err) {
    console.error(`openai call failed:`, err.message);
    extractionResult = {
      policy_number: { value: null, confidence: 0.0 },
      customer_name: { value: null, confidence: 0.0 },
      vehicle_number: { value: null, confidence: 0.0 },
      insurer_name: { value: null, confidence: 0.0 },
      premium_amount: { value: null, confidence: 0.0 },
      _openai_error: err.message,
    };
  }

  // save the extracted fields
  const updateData = {
    policy_number: extractionResult.policy_number?.value || null,
    customer_name: extractionResult.customer_name?.value || null,
    vehicle_number: extractionResult.vehicle_number?.value || null,
    insurer: extractionResult.insurer_name?.value || null,
    premium: extractionResult.premium_amount?.value
      ? parseFloat(extractionResult.premium_amount.value.replace(/[^0-9.]/g, ''))
      : null,
    extraction_confidence: extractionResult,
  };

  // update the db
  const updatedPolicy = await policyRepository.updatePolicyExtraction(policyId, updateData);

  if (!updatedPolicy) {
    console.error(`[ExtractionService] Policy ${policyId} not found in DB`);
    return;
  }

  // tell frontend to update
  try {
    const io = getIO();
    io.emit('policy:extraction_complete', {
      policy_id: updatedPolicy.id,
      policy_number: updatedPolicy.policy_number,
      customer_name: updatedPolicy.customer_name,
      vehicle_number: updatedPolicy.vehicle_number,
      insurer: updatedPolicy.insurer,
      premium: updatedPolicy.premium,
      extraction_confidence: updatedPolicy.extraction_confidence,
    });
    console.log(`sent socket event for ${policyId}`);
  } catch (err) {
    console.error(`socket fail:`, err.message);
  }

  // email user
  try {
    const downloadUrl = await getPresignedUrl(updatedPolicy.s3_file_key, 86400); // 24 hours link
    await sendPolicyCreatedEmail(updatedPolicy, downloadUrl);
    console.log(`email sent for ${policyId}`);
  } catch (err) {
    console.error(`email fail:`, err.message);
  }
}

module.exports = { extractPolicyData };