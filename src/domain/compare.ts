import Fuse from 'fuse.js'

const compare = (source: string, candidates: string[]) => {
  const options = {
    includeScore: true,
    threshold: 1,
    ignoreLocation: true,
  }

  const fuse = new Fuse(candidates, options)

  return fuse.search(source)
}

export default compare
