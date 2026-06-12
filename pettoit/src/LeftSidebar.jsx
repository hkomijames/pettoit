import AmazonAdds from "./AmazonAdds";
import ProductsCatalog from "./AmazonProducts";
import StickyBox from "react-sticky-box";

function LeftSidebar() {
    const randomProducts = ProductsCatalog();

    return (
        <StickyBox offsetTop={20}>
            <aside className="hidden lg:block w-64 rounded-2xl shadow-lg left-sidebar">

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

export default LeftSidebar;