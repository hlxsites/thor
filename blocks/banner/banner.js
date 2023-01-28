export default function decorate(block) {
  const cell = block.querySelector('p').closest('div');
  const bg = cell.querySelector('picture');
  bg.closest('p').remove();
  block.append(bg);
  cell.classList.add('banner-body');
}