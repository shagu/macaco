export let html = (data) => {
  let template = document.createElement("template")
  template.innerHTML = data
  return template.content
}

export let css = (data) => {
  let stylesheet = new CSSStyleSheet()
  stylesheet.replaceSync(data)
  return stylesheet
}