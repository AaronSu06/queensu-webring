# QUEENSU-WEBRING
A webring connecting students and alumni at Queen's University in Kingston, Ontario.

**[Visit the live webring](https://queensu-webring.ca)** | **[How to join](#joining)** | **[Widget examples](#widget-examples)**

## What is a webring?
Webrings are collections of personal websites connected in a ring structure, making personal sites more discoverable while building community. The Queen's Webring brings together current students and alumni to showcase their portfolios, projects, and personal spaces on the web.

## Joining
**Eligibility:** Current students or alumni of a recognized program at Queen's University (Kingston, ON, Canada).

### Steps to join:
1. **Add the webring widget to your site** (see templates below). We recommend placing it in your footer or navigation area.
2. **Fork this repository** and add your entry to the END of the array in your program's `.json` file under the `sites` folder (e.g., Computing students would add their entry to `cs.json`):
```json
{
    "name": "Your Name",
    "year": 20XX,
    "website": "https://yoursite.com/"
},
```
3. **Open a Pull Request** with your information. Include verification (like a LinkedIn profile or other social media) showing your connection to Queen's University.

Your PR will be reviewed and merged if you meet the eligibility requirements and your site contains no inappropriate content.

## Widget Examples
Below is a starter template using the white icon for Computing students. Each program has slight variations of this template:

### HTML
```html
<div style="display: flex; align-items: center; gap: 8px;">
    <a href="https://queensu-webring.ca/#yoursite.com?nav=prev">←</a>
    <a href="https://queensu-webring.ca/#yoursite.com" target="_blank">
        <img src="https://queensu-webring.ca/assets/icons/cs/icon-white.png" 
             alt="Queen's Computing Webring" 
             style="width: 24px; height: auto; opacity: 0.8;"/>
    </a>
    <a href="https://queensu-webring.ca/#yoursite.com?nav=next">→</a>
</div>
<!-- Replace 'yoursite.com' with your actual URL -->
```

### JSX/React
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <a href='https://queensu-webring.ca/#yoursite.com?nav=prev'>←</a>
    <a href='https://queensu-webring.ca/#yoursite.com' target='_blank'>
        <img
            src='https://queensu-webring.ca/assets/icons/cs/icon-white.png'
            alt="Queen's Computing Webring"
            style={{ width: '24px', height: 'auto', opacity: 0.8 }}
        />
    </a>
    <a href='https://queensu-webring.ca/#yoursite.com?nav=next'>→</a>
</div>
// Replace 'yoursite.com' with your actual URL
```

### Icon Variants
**Computing (cs):**
- White: `https://queensu-webring.ca/assets/icons/cs/icon-white.png`
- Black: `https://queensu-webring.ca/assets/icons/cs/icon-black.png`
- Navy Blue: `https://queensu-webring.ca/assets/icons/cs/icon-blue.png`

**Other programs:** Check the `/assets/icons/` folder for your program's icons.

Feel free to download and host these locally if needed.

## Credits & Acknowledgments
This project takes heavy inspiration from the webrings:
- **[UW CS Webring](https://cs.uwatering.com)** 
- **[UW SE Webring](https://se-webring.xyz)**
- **[UofT SKULE™ WebRing](https://webring.skule.ca/)**
  
Without them, this project would not have been made possible!

---

*Currently maintained by Aaron Su and Kevin Phan.*
