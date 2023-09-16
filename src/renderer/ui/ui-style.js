const style = document.createElement('style')
style.innerHTML = `
  html, body {
    font-family: system-ui, sans-serif;
    font-size: 10pt;

    margin: 0px;
    height: 100%;

    user-select: none;
    color: var(--font-normal);
    background-color: var(--window-light);
  }
`

document.head.appendChild(style)