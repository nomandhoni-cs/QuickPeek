

const GetPremiumFeature = () => {
  return (
        <div className="p-4 text-center">
      <h3 className="font-semibold mb-2">Premium Feature</h3>
      <p className="mb-4">Support this project by getting a License key and access all the premium features</p>
      <a 
        href="/pricing" 
        className="inline-block px-4 py-2 bg-[#32CD32] text-black rounded-lg hover:bg-green-400"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Pricing
      </a>
    </div>
  )
}

export default GetPremiumFeature