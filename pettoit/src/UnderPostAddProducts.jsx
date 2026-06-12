import { useMemo } from "react";
import AmazonAdds from "./AmazonAdds";
import dogBrush from "./assets/dogBrush.jpg";
import petTag from "./assets/petTag.jpg";
import dogBedCover from "./assets/dogBedCover.jpg";
import dogCollar from "./assets/dogCollar.jpg";
import eyeComb from "./assets/eyeComb.jpg";
import facialShampoo from "./assets/facialShampoo.jpg";
import catTree from "./assets/catTree.jpg";
import catTree1 from "./assets/catTree1.jpg";
import catToy from "./assets/catToy.jpg";

const products = [
        {
            id: 1,
            imageUrl: dogBrush,
            linkUrl: "https://amzn.to/445o1vT",
            title: "Deshedding Grooming Tool for Dogs & Cats",
            description: "Reduces shedding up to 90% with regular use. Perfect for dogs with medium to long hair.",
            price: 14.99,
            shoplink: "https://amzn.to/445o1vT"
        },
        {
            id: 2,
            imageUrl: petTag,
            linkUrl: "https://amzn.to/4upm2xi",
            title: "Pet Dwelling QR Code Pet ID Tag",
            description: "Any finder can scan the QR code to view your pet’s profile and contact you instantly with a one-tap call.",
            price: 14.98,
            shoplink: "https://amzn.to/4upm2xi"
        },
        {
            id: 3,
            imageUrl: dogBedCover,
            linkUrl: "https://amzn.to/3S1ainh",
            title: "100% Double-Sided Waterproof Dog Bed Cover",
            description: "The dog blanket has a excellent waterproof outer layer and a TPU waterproof membrane on the inner layer, which can achieve double waterproof protection.",
            price: 29.99,
            shoplink: "https://amzn.to/3S1ainh"
        },
        {
            id: 4,
            imageUrl: dogCollar,
            linkUrl: "https://amzn.to/4emLT3c",
            title: "Inflatable Dog Cone Collar Alternative",
            description: "While wearing the BENCMATE Collar, the inflatable function and the soft outside material will let your dog wear it comfortably and",
            price: 15.99,
            shoplink: "https://amzn.to/4emLT3c"
        },
        {
            id: 5,
            imageUrl: eyeComb,
            linkUrl: "https://amzn.to/4eyYfX1",
            title: "Professional Eye Comb for Pets",
            description: "Customers find the eye comb effective at removing eye gunk and debris around the eye area, while being gentle and comfortable to use.",
            price: 8.99,
            shoplink: "https://amzn.to/4eyYfX1"
        },
        {
            id: 6,
            imageUrl: facialShampoo,
            linkUrl: "https://amzn.to/4eAiQtW",
            title: "Pet Facial Shampoo for Dogs & Cats",
            description: "Gently cleanses your pet's face and surrounding areas, removing dirt and oils without irritating the skin.",
            price: 13.99,
            shoplink: "https://amzn.to/4eAiQtW"
        },
        {
            id: 7,
            imageUrl: catTree,
            linkUrl: "https://amzn.to/4vLaCVX",
            title: "Globlazer Heavy Duty Cat Tree",
            description: "Provides a fun and engaging play environment for your indoor cat with multiple levels and scratching posts.",
            price: 99.99,
            shoplink: "https://amzn.to/4vLaCVX"
        },
        {
            id: 8,
            imageUrl: catTree1,
            linkUrl: "https://amzn.to/4aGzkOS",
            title: "Heybly Cat Tree with Toy",
            description: " Structure of the cat tree is designed according the climbing habits of cats. Two jumping platforms not only increase the active space but also help kitties and older cats to climb up and down",
            price: 39.99,
            shoplink: "https://amzn.to/4aGzkOS"
        },
        {
            id: 9,
            imageUrl: catToy,
            linkUrl: "https://amzn.to/4omuaNF",
            title: "Potaroma Cat Toys Pillows",
            description: "Our catnip kicker toys are all made of soft plush material and baby-level cotton, soft and comfortable enough for your feline friends",
            price: 8.99,
            shoplink: "https://amzn.to/4omuaNF"
        }
    ];

function AmazonProducts() {
const randomProducts = useMemo(() => {
    const shuffled = [...products]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    return shuffled;
}, [products]);

return (
    <div className="grid grid-cols-1 mt-4 gap-4">
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
)
}

export default AmazonProducts;