const style = document.createElement('style')
style.innerHTML = `
  @media (prefers-color-scheme: light) {
    :root {
      color-scheme: light;
      --color-hover: rgba(230, 230, 230, 1);
      --color-select: rgba(215, 215, 215, 1);
      --color-accent: rgba(195, 217, 247, 1);
      --color-notify: rgba(53, 132, 228, 1);

      --border-dark: rgba(185, 185, 185,1);
      --border-normal: rgba(195, 195, 195,1);
      --border-light: rgba(205, 205, 205,1);

      --window-dark: rgba(255,255,255,1);
      --window-normal: rgba(215, 215, 215, 1);
      --window-light: rgba(245, 245, 245, 1);

      --widget-dark: rgba(215,215,215,1);
      --widget-normal: rgba(255,255,255,1);
      --widget-light: rgba(245,245,245,1);

      --font-dark: rgba(120, 120, 120, 1);
      --font-normal: rgba(20,20,20,1);
      --font-light: rgba(0,0,0,1);
    }
  }

  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --color-hover: rgba(45, 45, 45, 1);
      --color-select: rgba(30, 30, 30, 1);
      --color-accent: rgba(44, 59, 80,1);
      --color-notify: rgba(21, 83, 158, 1);

      --border-dark: rgba(20,20,20,1);
      --border-normal: rgba(30,30,30,1);
      --border-light: rgba(40,40,40,1);

      --window-dark: rgba(35,35,35,1);
      --window-normal: rgba(45,45,45,1);
      --window-light: rgba(55,55,55,1);

      --widget-dark: rgba(40,40,40,1);
      --widget-normal: rgba(50,50,50,1);
      --widget-light: rgba(60,60,60,1);

      --font-dark: rgba(130, 130, 130, 1);
      --font-normal: rgba(230,230,230,1);
      --font-light: rgba(255,255,255,1);
    }
  }
`

document.head.appendChild(style)