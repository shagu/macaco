export const html = (data) => {
  const template = document.createElement('template')
  template.innerHTML = data
  return template.content
}

export const css = (data) => {
  const stylesheet = new CSSStyleSheet()
  stylesheet.replaceSync(data)
  return stylesheet
}
