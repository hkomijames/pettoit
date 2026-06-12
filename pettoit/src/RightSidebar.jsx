import AmazonAdds from "./AmazonAdds";
import ProductsCatalog from "./AmazonProducts";
import StickyBox from "react-sticky-box";


function RightSidebar() {
    const randomProducts = ProductsCatalog();

    return (
        <StickyBox offsetTop={100}>
        <aside className="hidden md:block md:w-[18rem] md:mr-[1rem] rounded-2xl shadow-lg right-sidebar">

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
            </aside>
        </StickyBox>
    )
}

export default RightSidebar;