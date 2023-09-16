export const html = (data, ...vars) => {
  const template = document.createElement('template')

  let chunks = []
  for (let i = 0; i < data.length; i++) {
    chunks.push(data[i])

    if (vars[i] !== undefined) 
      chunks.push(vars[i])
  }

  template.innerHTML = chunks.join("")
  return template.content
}

export const css = (data) => {
  const stylesheet = new CSSStyleSheet()
  stylesheet.replaceSync(data)
  return stylesheet
}

export const dom = (p) => {
  for (const e of p.shadow.querySelectorAll( '*' ))
    if(e.id) p.dom[e.id] = p.shadow.getElementById(e.id)
}