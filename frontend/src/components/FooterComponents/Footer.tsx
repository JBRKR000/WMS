import { type FC } from 'react'

const Footer: FC = () => {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-3 text-sm text-gray-600">
        © {new Date().getFullYear()} WMS — all rights reserved
      </div>
    </footer>
  )
}

export default Footer