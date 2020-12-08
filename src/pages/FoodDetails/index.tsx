import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {

    async function loadFood(): Promise<void> {
      api.get<Food>(`foods/${routeParams.id}`).then(response => {
        let formattedFood = { ...response.data, formattedPrice: formatValue(response.data.price) }
        setFood(formattedFood)
      })

    }

    loadFood();
  }, [routeParams]);


  // useEffect(() => {
  //   api.get('favorites').then(response => {
  //     let isFavoriteFood = response.data.filter(item => item.id === food.id)
  //     if (isFavoriteFood.length) setIsFavorite(true)
  //   })
  // }, [food])

  useEffect(() => {
    if (food.extras) {
      let formattedExtras = food.extras.map(extra => {
        return {
          ...extra,
          quantity: extra.quantity ? extra.quantity : 0
        }
      })
      setExtras(formattedExtras)
    }
  }, [food.extras])

  function handleIncrementExtra(id: number): void {
    let foundExtraIndex = extras.findIndex(extra => extra.id == id)
    let foundExtra = extras.find(extra => extra.id == id)

    if (foundExtra) {
      let newExtras = extras
      if (newExtras[foundExtraIndex].quantity >= 1) {
        newExtras[foundExtraIndex].quantity = newExtras[foundExtraIndex].quantity + 1
      }
      else newExtras[foundExtraIndex].quantity = 1
      setFood({ ...food, extras: newExtras })
    } else return
  }

  function handleDecrementExtra(id: number): void {

    let foundExtraIndex = extras.findIndex(extra => extra.id == id)
    let foundExtra = extras.find(extra => extra.id == id)

    if (foundExtra) {
      let newExtras = extras
      if (newExtras[foundExtraIndex].quantity > 0) {
        newExtras[foundExtraIndex].quantity = newExtras[foundExtraIndex].quantity - 1
      }
      else newExtras[foundExtraIndex].quantity = 0
      setFood({ ...food, extras: newExtras })
    }
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(foodQuantity + 1)
  }

  function handleDecrementFood(): void {
    // Decrement food quantity

    if (foodQuantity > 1) setFoodQuantity(foodQuantity - 1)
    else return
  }

  const toggleFavorite = useCallback(() => {
    if (isFavorite) api.delete(`favorites/${food.id}`)
    else api.post(`favorites`, food)
    setIsFavorite(isFavorite)
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {

    const totalExtras = extras.reduce((acc, extra) => {
      const extraSubTotal = extra.value * extra.quantity;
      return acc + extraSubTotal
    }, 0)

    const subTotal = totalExtras + Number(food.price)
    return formatValue(subTotal * foodQuantity)
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API

    await api.post('orders', food)
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar

    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
