function truncateDescription(description, maxLength = 60) {
if (description.length <= maxLength) return description;
return description.slice(0, maxLength) + '...';
}

function AmazonAdds({ imageUrl, linkUrl,  title, description, price, shoplink }) {
    return (
        <div className="flex flex-col justify-between gap-2 w-80 h-auto rounded-lg shadow-xl border-green-800 border p-2 mb-4">
            <h2 className="text-lg text-center font-bold text-white">
                <a href={linkUrl} target="_blank" rel="nofollow">
                    {title}
                </a>
            </h2>
            <img src={imageUrl} alt={title} className="w-80 h-64 object-fit rounded" />
            <h3 className="text-base text-white">{truncateDescription(description)}</h3>
            <p className="text-xl font-bold text-white">${price}</p>
            
                <a href={shoplink} target="_blank" rel="nofollow">
                    <button className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded w-full cursor-pointer">Check it Out at Amazon</button>
                </a>
        </div>
    )
}

export default AmazonAdds;