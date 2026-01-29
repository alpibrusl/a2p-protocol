# Example 11: Accessibility Profile

This example demonstrates how to use a2p accessibility preferences for adaptive UI and real-world services.

## Overview

Users can specify accessibility needs in their profile, and services can automatically adapt:

- **Digital services**: Generative UI adapts interfaces
- **Physical services**: Reservations include accessibility requirements

## Use Cases

### Digital Accessibility

- **Color blindness**: Services use accessible color palettes
- **Screen readers**: Content is optimized for assistive technology
- **Reduced motion**: Animations are minimized or disabled
- **Large text**: Font sizes are increased
- **Captions**: Audio content includes subtitles

### Physical Accessibility

- **Restaurant reservations**: Food allergies, dietary restrictions
- **Hotel bookings**: Wheelchair-accessible room, service animal
- **Airline travel**: Early boarding, special seating, dietary meals
- **Healthcare visits**: Allergies, medical devices, emergency info
- **Event venues**: Accessible seating, interpreter needs

## Run the Example

### TypeScript

```bash
cd typescript
npx ts-node index.ts
```

### What It Demonstrates

1. **Generative UI Service**: Adapts interface based on vision, motor, and cognitive needs
2. **Restaurant Reservation**: Prepares kitchen staff with allergy alerts and dietary requirements
3. **Privacy Protection**: Shows how different services receive only the data they need

## Example Profile

See `accessible-profile.json` for a complete example of a user with accessibility preferences.

## Running the Example

### TypeScript

```bash
cd typescript
npm install
npx ts-node index.ts
```

### Python

```bash
cd python
npm install
npm run 11:*
```

## How It Works

1. User profile includes `preferences.accessibility` with their needs
2. Service/agent requests `a2p:preferences.accessibility` scope
3. Profile returns accessibility preferences
4. Generative UI adapts interface based on preferences

## Privacy Considerations

Accessibility information can reveal health conditions. The example shows how to:

- Share accessibility info only for UI adaptation
- Prevent storage of accessibility data
- Restrict third-party sharing
