import AmazonAdds from "./AmazonAdds";
import ProductsCatalog from "./AmazonProducts";
import StickyBox from "react-sticky-box";
import NewPets from "./NewMembers";
import { Link } from "react-router";

function RightSidebar() {
    const randomProducts = ProductsCatalog();

    return (
        <StickyBox offsetTop={20}>
        <aside className="hidden md:block md:w-[18rem] md:mr-4 rounded-2xl shadow-lg right-sidebar">
<NewPets />
            <div className="grid grid-cols-1 gap-4">
    {randomProducts.map(product => (
        <AmazonAdds
            key={product.id}
            imageUrl={product.imageUrl}
            linkUrl={product.linkUrl}
            title={product.title}
            description={product.description}
            price={product.price}
            shoplink={product.shoplink}
        />
    ))}
</div>

<Link to="/about" className="block mt-4 text-center text-[#1A365D] font-semibold hover:underline mb-4">
    About Us/Contact Us
</Link>
            </aside>
        </StickyBox>
    )
}

export default RightSidebar;