# Google Analytics Setup Guide

This guide will walk you through setting up Google Analytics 4 (GA4) for your portfolio game.

## Step 1: Create a Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **"Start measuring"** (or **"Admin"** if you already have an account)
3. Create an account:
   - Enter an **Account name** (e.g., "My Portfolio")
   - Configure data sharing settings (optional)
   - Click **Next**

## Step 2: Create a Property

1. Enter a **Property name** (e.g., "Portfolio Game")
2. Select your **time zone** and **currency**
3. Click **Next**
4. Fill in business information:
   - Industry category
   - Business size
5. Select your objectives (e.g., "Examine user behavior")
6. Click **Create**
7. Accept the Terms of Service

## Step 3: Set Up Data Stream

1. Select **Web** as your platform
2. Enter your **website URL** (e.g., `https://yourdomain.com`)
3. Enter a **Stream name** (e.g., "Portfolio Game Website")
4. Click **Create stream**

## Step 4: Get Your Measurement ID

After creating the stream, you'll see a **Measurement ID** that looks like: `G-XXXXXXXXXX`

**Copy this ID** - you'll need it in the next step!

## Step 5: Add Your Measurement ID to the Project

1. Open `index.html` in your project
2. Find these two lines:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   ```
   and
   ```javascript
   gtag('config', 'G-XXXXXXXXXX');
   ```
3. **Replace** `G-XXXXXXXXXX` with your actual Measurement ID (in **both** places!)

Example:
```html
<!-- Before -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- After (with your ID) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ9"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ABC123XYZ9');
</script>
```

## Step 6: Deploy Your Site

After adding your Measurement ID:
1. Build your project: `npm run build`
2. Deploy to your hosting service
3. Visit your live site to generate some test data

## Step 7: Verify It's Working

1. Go back to [Google Analytics](https://analytics.google.com/)
2. Navigate to **Reports** > **Realtime**
3. Open your portfolio game in a browser
4. You should see yourself as an active user in real-time!

---

## What Events Are Being Tracked?

Your portfolio game now tracks these custom events:

### Game Events
- ✅ **game_start** - When someone starts playing
- ✅ **castle_entered** - When entering castles (which castle)
- ✅ **key_collected** - When collecting keys (blue/green)
- ✅ **chest_opened** - When opening chests (which chest, location)

### Content Interactions
- ✅ **project_viewed** - When viewing project details
- ✅ **experience_viewed** - When viewing work experience
- ✅ **click** - When clicking project links (outbound)

### Navigation
- ✅ **scene_change** - When transitioning between scenes

---

## Viewing Your Analytics Data

### Real-time Reports
See who's playing **right now**:
- Go to **Reports** > **Realtime**
- See active users, their locations, and what they're doing

### Custom Event Reports

#### View All Events:
1. Go to **Reports** > **Engagement** > **Events**
2. You'll see all custom events: `game_start`, `castle_entered`, `key_collected`, etc.

#### Create Custom Reports:
1. Go to **Explore** (in the left sidebar)
2. Click **"Blank"** to create a new exploration
3. Add dimensions and metrics to analyze your data

### Example Reports You Can Create:

**🎮 Game Engagement Report**
- See how many users collected all keys
- Track castle entry rates
- View average session duration

**📊 Project Popularity**
- Which projects get the most views?
- Which projects get the most link clicks?
- Time spent viewing each project

**🗺️ Player Journey**
- See the path users take through your game
- Identify where users spend the most time
- Find drop-off points

---

## Useful Custom Reports

### 1. Create a "Key Collection Rate" Report

1. Go to **Explore** > **Free form**
2. Add these dimensions:
   - Event name: `key_collected`
   - Custom dimension: `key_color`
3. Add metric: Event count
4. This shows which keys are collected most often

### 2. Create a "Most Viewed Projects" Report

1. Go to **Explore** > **Free form**
2. Filter by event: `project_viewed`
3. Add dimension: `project_title`
4. Add metric: Event count
5. Sort by count descending

### 3. Track Completion Rate

Create a funnel to see how many players:
1. Start the game (`game_start`)
2. Enter a castle (`castle_entered`)
3. Collect a key (`key_collected`)
4. View a project (`project_viewed`)

---

## Privacy & GDPR Compliance

If you have users from the EU, consider:

1. Adding a cookie consent banner
2. Updating your privacy policy
3. Enabling IP anonymization (it's on by default in GA4)

To enable anonymization, add this to your GA config in `index.html`:
```javascript
gtag('config', 'G-XXXXXXXXXX', {
  'anonymize_ip': true
});
```

---

## Tips for Better Analytics

1. **Wait 24-48 hours** for data to fully populate
2. **Use real-time view** to test events immediately
3. **Set up custom alerts** for important metrics
4. **Export data** to Google Sheets for advanced analysis
5. **Share reports** with potential employers to show engagement!

---

## Troubleshooting

### "No data showing in Analytics"
- Wait a few hours (data can take time to process)
- Check browser console for errors
- Verify your Measurement ID is correct
- Make sure you're testing on the deployed site (not localhost)

### "Events not showing"
- Open browser dev tools > Console
- Look for GA4 debug messages
- Check that `Analytics.isAvailable()` returns true

### "Test locally"
Add debug mode to see events in console:
```javascript
gtag('config', 'G-XXXXXXXXXX', {
  'debug_mode': true
});
```

---

## Next Steps

Once you have data flowing:
1. Check your analytics **weekly** to see engagement
2. Add more custom events if needed
3. Use insights to improve your portfolio
4. **Mention it in job applications!** "My portfolio game has X active users with Y% completing the experience"

---

## Cost

**Google Analytics is 100% FREE** for your use case. The free tier includes:
- ✅ Unlimited events
- ✅ Unlimited users (up to 10 million events/month)
- ✅ Real-time reporting
- ✅ Custom reports
- ✅ Data retention (2-14 months)

You won't need to pay anything! 🎉
