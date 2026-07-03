function truncateDescription(description, maxLength = 60) {
if (description.length <= maxLength) return description;
return description.slice(0, maxLength) + '...';
}

function AmazonAdds({ imageUrl, linkUrl,  title, description, price, shoplink }) {
    return (
        <div className="flex flex-col justify-between bg-white gap-2 w-full h-auto rounded-lg shadow-xl border-green-800 border p-2 mb-4">
            <h2 className="text-lg text-center text-[#1A365D] font-bold">
                <a href={linkUrl} target="_blank" rel="nofollow">
                    {title}
                </a>
            </h2>
            <img loading="lazy" src={imageUrl} alt={title} className="w-full h-75 object-contain rounded" />
            <h3 className="text-base text-[#1A365D]">{truncateDescription(description)}</h3>
            <p className="text-xl font-bold text-[#1A365D]">${price}</p>
            
                <a href={shoplink} target="_blank" rel="nofollow">
                    <button className="check-out-btn text-[#edf0f4] font-bold py-2 px-4 rounded w-full cursor-pointer">Check it Out at Amazon</button>
                </a>
        </div>
    )
}

export default AmazonAdds;