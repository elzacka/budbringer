import { renderDigestHtml, renderDigestText } from '../lib/email';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Test data with markdown formatting
const testDigestData = {
  dateLabel: "Fredag 27. september 2025",
  lead: "Dagens viktigste KI-nyheter viser at **kunstig intelligens** fortsetter å revolusjonere teknologibransjen. Vi ser spennende utvikling innen *maskinlæring* og nye produktlanseringer som vil påvirke norske bedrifter.",
  sections: [
    {
      heading: "🚀 **Produktnyheter**",
      bullets: [
        "**OpenAI** lanserer ny versjon av GPT-4 med forbedret *norsk språkstøtte* og bedre ytelse",
        "Google AI introduserer *Bard Enterprise* for bedrifter - nå tilgjengelig i Norge",
        "Microsoft Copilot får **nye funksjoner** for kodegenerering og dokumenthåndtering"
      ],
      link: "https://openai.com/news"
    },
    {
      heading: "🔬 **Forskning og utvikling**",
      bullets: [
        "**NTNU** publiserer studie om KI i *norsk helsevesen* - viser lovende resultater",
        "Ny forskningsrapport: KI kan **redusere energiforbruk** med opptil 30% i datasentre",
        "Europeiske forskere utvikler *etiske retningslinjer* for KI-utvikling"
      ]
    },
    {
      heading: "💼 **Næringsliv og regulering**",
      bullets: [
        "**EU vedtar** nye KI-reguleringer som påvirker *norske tech-selskaper*",
        "Equinor investerer **1 milliard kroner** i KI-satsing for olje- og gassektoren",
        "Norske myndigheter lanserer *digital strategi* for offentlig sektor med fokus på KI"
      ],
      link: "https://regjeringen.no/digital-strategi"
    }
  ],
  actions: [
    "**Utforsk** hvordan *GPT-4 turbo* kan forbedre din bedrifts kundeservice",
    "**Delta** på NTNUs webinar om KI i helsevesen (påmelding [her](https://ntnu.no/webinar))",
    "**Vurder** om din bedrift er klar for EUs nye KI-reguleringer",
    "**Test** Microsoft Copilot for å se om det kan effektivisere dine `arbeidsprosesser`"
  ],
  audioUrl: "https://budbringer.no/audio/2025-09-27"
};

async function testEmailDesign() {
  console.log('🎨 Testing email design with markdown formatting...');

  // Generate HTML version
  console.log('📧 Generating HTML email...');
  const htmlContent = renderDigestHtml(testDigestData);

  // Generate text version
  console.log('📝 Generating text email...');
  const textContent = renderDigestText(testDigestData);

  // Save to files for inspection
  const outputDir = join(process.cwd(), 'test-output');

  try {
    // Create output directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = join(outputDir, 'newsletter-test.html');
    const textPath = join(outputDir, 'newsletter-test.txt');

    writeFileSync(htmlPath, htmlContent);
    writeFileSync(textPath, textContent);

    console.log('✅ Email templates generated successfully!');
    console.log(`📁 HTML version saved to: ${htmlPath}`);
    console.log(`📁 Text version saved to: ${textPath}`);

    // Test markdown processing
    console.log('\n🔍 Testing markdown processing:');

    // Check that markdown is converted in HTML
    const hasStrongTags = htmlContent.includes('<strong>');
    const hasEmTags = htmlContent.includes('<em>');
    const hasLinks = htmlContent.includes('<a href=');
    const noRawMarkdown = !htmlContent.includes('**') && !htmlContent.includes('*text*');

    console.log(`  Bold formatting (HTML): ${hasStrongTags ? '✅' : '❌'}`);
    console.log(`  Italic formatting (HTML): ${hasEmTags ? '✅' : '❌'}`);
    console.log(`  Links (HTML): ${hasLinks ? '✅' : '❌'}`);
    console.log(`  No raw markdown in HTML: ${noRawMarkdown ? '✅' : '❌'}`);

    // Check that markdown is cleaned in text
    const noMarkdownInText = !textContent.includes('**') && !textContent.includes('*text*');
    const hasProperBullets = textContent.includes('•');

    console.log(`  Clean text (no markdown): ${noMarkdownInText ? '✅' : '❌'}`);
    console.log(`  Proper bullet points: ${hasProperBullets ? '✅' : '❌'}`);

    // Design improvements check
    console.log('\n🎨 Testing design improvements:');

    const hasGradients = htmlContent.includes('linear-gradient');
    const hasRoundedCorners = htmlContent.includes('border-radius');
    const hasBrandColors = htmlContent.includes('#0ea5e9') || htmlContent.includes('#38bdf8');
    const hasModernShadows = htmlContent.includes('box-shadow');
    const hasInterFont = htmlContent.includes('Inter');

    console.log(`  Gradients: ${hasGradients ? '✅' : '❌'}`);
    console.log(`  Rounded corners: ${hasRoundedCorners ? '✅' : '❌'}`);
    console.log(`  Brand colors (sky/cyan): ${hasBrandColors ? '✅' : '❌'}`);
    console.log(`  Modern shadows: ${hasModernShadows ? '✅' : '❌'}`);
    console.log(`  Inter font: ${hasInterFont ? '✅' : '❌'}`);

    console.log('\n🌟 All tests completed! Open the HTML file in a browser to see the visual result.');
    console.log(`   File: file://${htmlPath}`);

  } catch (error) {
    console.error('❌ Error generating email templates:', error);
  }
}

// Handle both direct execution and module import
if (require.main === module) {
  testEmailDesign().catch(console.error);
}

export { testEmailDesign };