#!/usr/bin/env node

/**
 * Test script pentru verificarea integrarei newsletter cu MailerLite API
 * Rulează: node scripts/test-newsletter.js
 */

const BASE_URL = 'http://localhost:3000'

/**
 * Testează API-ul newsletter cu diferite scenarii
 */
async function testNewsletterAPI() {
  console.log('🧪 Testare Newsletter API...\n')

  const tests = [
    {
      name: 'Test email valid',
      email: 'test@example.com',
      expectedStatus: 200
    },
    {
      name: 'Test email invalid',
      email: 'invalid-email',
      expectedStatus: 400
    },
    {
      name: 'Test email gol',
      email: '',
      expectedStatus: 400
    },
    {
      name: 'Test email cu spații',
      email: '  test@example.com  ',
      expectedStatus: 200
    }
  ]

  for (const test of tests) {
    console.log(`📧 ${test.name}...`)
    
    try {
      const response = await fetch(`${BASE_URL}/api/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: test.email }),
      })

      const data = await response.json()
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: PASSED`)
        console.log(`   Status: ${response.status}`)
        console.log(`   Message: ${data.message}`)
      } else {
        console.log(`❌ ${test.name}: FAILED`)
        console.log(`   Expected: ${test.expectedStatus}, Got: ${response.status}`)
        console.log(`   Message: ${data.message}`)
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`)
      console.log(`   Error: ${error.message}`)
    }
    
    console.log('')
  }
}

/**
 * Testează rate limiting
 */
async function testRateLimiting() {
  console.log('🚦 Testare Rate Limiting...\n')
  
  const promises = []
  
  // Trimite 15 cereri rapid (peste limita de 10/minut)
  for (let i = 0; i < 15; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: `test${i}@example.com` }),
      })
    )
  }

  try {
    const responses = await Promise.all(promises)
    const rateLimitedCount = responses.filter(r => r.status === 429).length
    
    console.log(`📊 Rate limiting test:`)
    console.log(`   Total requests: ${responses.length}`)
    console.log(`   Rate limited: ${rateLimitedCount}`)
    console.log(`   Success: ${responses.filter(r => r.status === 200).length}`)
    
    if (rateLimitedCount > 0) {
      console.log('✅ Rate limiting funcționează corect')
    } else {
      console.log('⚠️  Rate limiting nu pare să funcționeze')
    }
  } catch (error) {
    console.log(`❌ Rate limiting test error: ${error.message}`)
  }
  
  console.log('')
}

/**
 * Testează validarea email-ului
 */
function testEmailValidation() {
  console.log('🔍 Testare Validare Email...\n')
  
  const testEmails = [
    { email: 'test@example.com', valid: true },
    { email: 'user.name@domain.co.uk', valid: true },
    { email: 'test+tag@example.com', valid: true },
    { email: 'invalid-email', valid: false },
    { email: '@example.com', valid: false },
    { email: 'test@', valid: false },
    { email: 'test@.com', valid: false },
    { email: '', valid: false },
    { email: '  test@example.com  ', valid: true }
  ]

  testEmails.forEach(({ email, valid }) => {
    // Regex mai robust pentru validare email (același ca în API)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email.trim())
    
    if (isValid === valid) {
      console.log(`✅ "${email}" - ${isValid ? 'VALID' : 'INVALID'}`)
    } else {
      console.log(`❌ "${email}" - Expected: ${valid}, Got: ${isValid}`)
    }
  })
  
  console.log('')
}

/**
 * Funcția principală
 */
async function main() {
  console.log('🚀 Începere testare Newsletter Integration\n')
  
  // Testează validarea email-ului
  testEmailValidation()
  
  // Testează API-ul
  await testNewsletterAPI()
  
  // Testează rate limiting
  await testRateLimiting()
  
  console.log('✨ Testare completă!')
  console.log('\n📝 Note:')
  console.log('- Asigură-te că serverul rulează pe localhost:3000')
  console.log('- Verifică că variabilele de mediu sunt configurate corect')
  console.log('- Verifică logs-urile pentru detalii suplimentare')
}

// Rulează testele
main().catch(console.error)
