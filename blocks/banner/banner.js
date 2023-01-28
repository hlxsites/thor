export default function decorate(block) {
  const row = block.firstElementChild;
  const cols = [...row.children];
  block.classList.add(`banner-${cols.length}-cols`);

  if (cols.length === 2) {
    const bg = row.querySelector('picture');
    const bgDiv = bg.closest('div');
    block.append(bg);
    bgDiv.remove();
    row.classList.add('banner-body');
  }

  if (cols.length === 3) {
    ['image', 'body', 'cta'].forEach((e, i) => {
      cols[i].classList.add(`banner-${e}`);
    });
  }
}
