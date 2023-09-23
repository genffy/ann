// add css style
if (document.getElementById('mouseOnStyle') == null) {
  const style = document.createElement('style')
  style.id = 'mouseOnStyle'
  style.textContent = `
  .mouseOn{
    background-color: #bcd5eb !important;
    outline: 2px solid #5166bb !important;
  }
  `
  document.head.appendChild(style)
}

function getContentToClipbord(content: string) {
  var delta = 500
  var lastKeypressTime = 0
  function KeyHandler(event: KeyboardEvent) {
    if (event.key.toUpperCase() === 'C') {
      var thisKeypressTime = Date.now()
      if (thisKeypressTime - lastKeypressTime <= delta) {
        // set the content to clipboard
        navigator.clipboard.writeText(content)
        // optional - if we'd rather not detect a triple-press
        // as a second double-press, reset the timestamp
        thisKeypressTime = 0
      }
      lastKeypressTime = thisKeypressTime
    }
  }
  document.addEventListener('keypress', KeyHandler, false)
}

// listen mouseup hover event
let prevElement: HTMLElement | null = null
document.addEventListener('mouseover', event => {
  var elem = (event.target || event.srcElement) as HTMLElement
  if (prevElement != null) {
    prevElement.classList.remove('mouseOn')
  }
  if (elem != null) {
    // add a new class to the element
    elem.classList.add('mouseOn')
    getContentToClipbord(elem.innerText)
  }
  prevElement = elem
})
