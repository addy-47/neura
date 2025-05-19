# Echo Sphere Integration Guide

This guide explains how to integrate the Echo Sphere animation into your Neura app or any other web application.

## Overview

The Echo Sphere is a 3D glass sphere visualization that reacts to text with organic wave-like distortions. Each character creates unique wave patterns with varied heights, creating a visually distinctive representation of speech or text.

## Files Included

- `index.html` - The complete standalone implementation with HTML, CSS, and JavaScript

## Integration Options

### Option 1: Embed as an iframe (Simplest)

If you want to quickly add the Echo Sphere to your app without modifying your existing codebase:

1. Host the `index.html` file on your server
2. Embed it in your app using an iframe:

```html
<iframe src="path/to/index.html" width="100%" height="500px" frameborder="0"></iframe>
```

### Option 2: Direct Integration (Recommended)

For better performance and customization, integrate the code directly into your app:

1. **Add the HTML structure**:
   
```html
<div id="canvas-container"></div>
  
<div id="ui-container">
  <h1>Neura AI Interface</h1>
  <p>Glass sphere visualization with word-reactive wave distortions</p>
  
  <div id="current-text"></div>
  
  <div class="control-buttons">
    <button id="stop-button">Stop Animation</button>
    
    <div class="sample-sentences">
      <strong>Sample Sentences:</strong>
      <div class="sample-sentence" data-text="Hello, how can I help you today?">Hello, how can I help you today?</div>
      <!-- Add more sample sentences as needed -->
    </div>
  </div>
</div>
```

2. **Add the CSS styles** from the `<style>` section of index.html to your CSS file

3. **Add the Three.js dependencies**:

```html
<script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
  }
</script>
```

4. **Copy the JavaScript code** from the `<script type="module">` section of index.html to your JavaScript file

### Option 3: React Component Integration

If you're using React:

1. Create a new component file (e.g., `EchoSphere.jsx`)
2. Adapt the code from index.html into a React component structure
3. Use `useEffect` for initialization and cleanup
4. Import Three.js using npm packages instead of CDN

## Customization

### Modifying the Appearance

- **Glass Material**: Adjust the `refractionRatio`, `fresnelBias`, `fresnelScale`, and `fresnelPower` values in the `createGlassSphere` function
- **Colors**: Modify the gradient colors in the `createInnerSphere` function
- **Lighting**: Adjust light positions and intensities in the `setupLighting` function

### Modifying the Animation

- **Wave Patterns**: Edit the `charMappings` object to change how different characters animate
- **Gradient Patterns**: Modify the `gradientPatterns` array to change the internal gradient animations

## API for Programmatic Control

You can control the Echo Sphere programmatically by calling these functions:

### Animate Text

To make the sphere animate to a specific text:

```javascript
// Get a reference to the animation functions
const echoSphereController = window.echoSphereController;

// Animate text
echoSphereController.animateText("Your text here");
```

### Stop Animation

To stop the current animation:

```javascript
echoSphereController.stopAnimation();
```

## Implementation for Neura App

To integrate with your Neura app specifically:

1. Add the Echo Sphere to your character page
2. Connect it to your speech recognition or text input system
3. When the AI responds, pass the text to the `animateText` function
4. For real-time speech, you can animate character by character as they're generated

## Performance Considerations

- The animation is optimized for modern browsers but may be resource-intensive on low-end devices
- For mobile optimization, consider:
  - Reducing the sphere geometry complexity (lower the segment count)
  - Simplifying the shader effects
  - Using a lower resolution renderer

## Troubleshooting

- **Black Screen**: Check browser console for errors; ensure Three.js is loading correctly
- **Performance Issues**: Reduce geometry complexity and shader effects
- **Animation Not Working**: Verify event listeners are properly connected

## Browser Compatibility

The Echo Sphere works in all modern browsers that support WebGL:
- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

## Need Help?

If you encounter any issues or need customization help, please refer to the Three.js documentation or contact the developer.
