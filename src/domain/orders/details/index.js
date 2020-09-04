import React, { useState, useEffect, Fragment } from "react"
import { Text, Flex, Box, Image } from "rebass"
import ReactJson from "react-json-view"
import styled from "@emotion/styled"
import moment from "moment"

import testThumbnail from "./thumbnail-test.jpg"
import ReturnMenu from "./returns"
import RefundMenu from "./refund"

import Card from "../../../components/card"
import Spinner from "../../../components/spinner"

import Medusa from "../../../services/api"
import useMedusa from "../../../hooks/use-medusa"
import Typography from "../../../components/typography"
import { navigate } from "gatsby"

const CustomerEmailLabel = styled(Text)`
  ${props =>
    props.customerExist &&
    `
  color: #006fbb;
  z-index: 1000;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
  `}
`

const LineItemLabel = styled(Text)`
  ${Typography.Base};

  cursor: pointer;

  font-size: 10px;
`

const Divider = props => (
  <Box
    {...props}
    as="hr"
    m={props.m}
    sx={{
      bg: "#e3e8ee",
      border: 0,
      height: 1,
    }}
  />
)

const LineItem = ({ lineItem, currency, taxRate }) => {
  const productId = Array.isArray(lineItem.content)
    ? lineItem.content[0].product._id
    : lineItem.content.product._id

  return (
    <Flex pl={3} alignItems="center">
      <Flex pr={3}>
        {lineItem.quantity} x{" "}
        <Image
          ml={3}
          src={lineItem.thumbnail || ""}
          sx={{
            objectFit: "contain",
            width: 35,
            height: 35,
          }}
        />
        <LineItemLabel
          ml={2}
          mr={5}
          onClick={() => navigate(`/a/products/${productId}`)}
        >
          {lineItem.title}
          <br /> {lineItem.content.variant.sku}
          <br />
          {(1 + taxRate) * lineItem.content.unit_price} {currency}
        </LineItemLabel>
      </Flex>
    </Flex>
  )
}

const OrderDetails = ({ id }) => {
  const [showRefund, setShowRefund] = useState(false)
  const [showReturnMenu, setShowReturnMenu] = useState(false)
  const [isHandlingOrder, setIsHandlingOrder] = useState(false)
  const [showMetadataEdit, setShowMetadataEdit] = useState(false)

  const {
    order,
    capturePayment,
    return: returnOrder,
    refund,
    isLoading,
    archive,
    complete,
    toaster,
  } = useMedusa("orders", {
    id,
  })

  if (isLoading) {
    return (
      <Flex flexDirection="column" alignItems="center" height="100vh" mt="auto">
        <Box height="75px" width="75px" mt="50%">
          <Spinner dark />
        </Box>
      </Flex>
    )
  }

  const returns = order.returns.map(r => {
    const items = r.items.map(i => {
      const line = order.items.find(({ _id }) => i.item_id === _id)
      return {
        item: line,
        quantity: i.quantity,
      }
    })
    return {
      items,
      refund_amount: r.refund_amount,
      created: r.created,
    }
  })

  const fulfillmentBgColor =
    order.fulfillment_status === "fulfilled" ? "#4BB543" : "#e3e8ee"
  const fulfillmentColor =
    order.fulfillment_status === "fulfilled" ? "white" : "#4f566b"

  const paymentBgColor =
    order.payment_status === "captured" ? "#4BB543" : "#e3e8ee"
  const paymentColor = order.payment_status === "captured" ? "white" : "#4f566b"

  return (
    <Flex flexDirection="column" mb={5}>
      <Flex flexDirection="column" mb={5}>
        <Card mb={2}>
          <Card.Header
            badge={{ label: order.status }}
            action={
              order.status !== "archived" && {
                type: "",
                label: order.status === "completed" ? "Archive" : "Complete",
                onClick: () => {
                  setIsHandlingOrder(true)
                  if (order.status === "completed") {
                    archive(order._id)
                      .then(() =>
                        toaster("Order successfully archived", "success")
                      )
                      .catch(() => toaster("Failed to archive order", "error"))
                  } else if (order.status === "pending") {
                    complete(order._id)
                      .then(() =>
                        toaster("Order successfully completed", "success")
                      )
                      .catch(() => toaster("Failed to complete order", "error"))
                  }
                  setIsHandlingOrder(false)
                },
                isLoading: isHandlingOrder,
              }
            }
          >
            #{order.display_id}
          </Card.Header>
          <Box>
            <Text p={3} fontWeight="bold">
              {order.total} {order.region.currency_code}
            </Text>
          </Box>
          <Card.Body>
            <Box pl={3} pr={2}>
              <Text pb={1} color="gray">
                Date
              </Text>
              <Text>
                {moment(order.created).format("MMMM Do YYYY, h:mm:ss")}
              </Text>
            </Box>
            <Card.VerticalDivider mx={3} />
            <Box pl={3} pr={2}>
              <Text pb={1} color="gray">
                Customer
              </Text>
              <Text>{order.email}</Text>
            </Box>
            <Card.VerticalDivider mx={3} />
            <Box pl={3} pr={2}>
              <Text pb={1} color="gray">
                Payment
              </Text>
              <Text>{order.payment_method.provider_id}</Text>
            </Box>
          </Card.Body>
        </Card>
      </Flex>
      {/* Line items */}
      <Card mb={2}>
        <Card.Header
          action={{
            type: "primary",
            label: "Register returns",
            onClick: () => setShowReturnMenu(!showReturnMenu),
          }}
        >
          Timeline
        </Card.Header>
        <Card.Body flexDirection="column">
          <Text ml={3} fontSize={1} color="grey">
            Placed
          </Text>
          <Text fontSize="11px" color="grey" ml={3} mb={3}>
            {moment(order.created).format("MMMM Do YYYY, H:mm:ss")}
          </Text>
          {order.items.map((lineItem, i) => (
            <LineItem
              key={i}
              currency={order.currency_code}
              lineItem={lineItem}
              taxRate={order.region.tax_rate}
            />
          ))}
          {returns.length > 0 && <Divider m={3} />}
          {returns &&
            returns.map((r, i) => (
              <Fragment key={i}>
                <Text ml={3} fontSize={1} color="grey">
                  Items returned
                </Text>
                <Text fontSize="11px" color="grey" ml={3} mb={3}>
                  {moment(parseInt(r.created)).format("MMMM Do YYYY, H:mm:ss")}
                </Text>
                {r.items.map((item, i) => (
                  <LineItem
                    key={i}
                    currency={order.currency_code}
                    lineItem={item.item}
                    taxRate={order.region.tax_rate}
                  />
                ))}
                {/* <Flex px={3} py={3}>
                <Text pl={5}>
                  {r.refund_amount} {order.currency_code}
                </Text>
              </Flex> */}
              </Fragment>
            ))}
          {order.fulfillments.length > 0 && <Divider m={3} />}
          {order.fulfillments &&
            order.fulfillments.map(f => (
              <Fragment key={f._id}>
                <Text ml={3} fontSize={1} color="grey">
                  Fulfilled
                </Text>
                <Text fontSize="11px" color="grey" ml={3} mb={3}>
                  {moment(parseInt(f.created)).format("MMMM Do YYYY, H:mm:ss")}
                </Text>
                {f.items.map((item, i) => (
                  <LineItem
                    key={i}
                    currency={order.currency_code}
                    lineItem={item}
                    taxRate={order.region.tax_rate}
                  />
                ))}
              </Fragment>
            ))}
        </Card.Body>
      </Card>
      {/* PAYMENT */}
      <Card mb={2}>
        <Card.Header
          badge={{
            label: order.payment_status,
            color: paymentColor,
            bgColor: paymentBgColor,
          }}
          action={
            order.payment_status !== "captured"
              ? {
                  type: "",
                  label: "Capture",
                  onClick: () => {
                    capturePayment()
                      .then(() =>
                        toaster("Succesfully captured payment", "success")
                      )
                      .catch(() =>
                        toaster("Failed to capture payment", "error")
                      )
                  },
                  isLoading: isHandlingOrder,
                }
              : {
                  type: "primary",
                  label: "Refund",
                  onClick: () => setShowRefund(!showRefund),
                }
          }
        >
          Payment
        </Card.Header>
        <Card.Body flexDirection="column">
          <Flex>
            <Box pl={3} pr={5}>
              <Text color="gray">Subtotal</Text>
              <Text pt={1} color="gray">
                Shipping
              </Text>
              <Text pt={1} color="gray">
                Tax
              </Text>
              <Text pt={1} color="gray">
                Total
              </Text>
            </Box>
            <Box px={3}>
              <Text>
                {order.subtotal * (1 + order.region.tax_rate)}{" "}
                {order.region.currency_code}
              </Text>
              <Text pt={1}>
                {order.shipping_total} {order.region.currency_code}
              </Text>
              <Text pt={1}>
                {order.tax_total} {order.region.currency_code}
              </Text>
              <Text pt={1}>
                {order.total} {order.region.currency_code}
              </Text>
            </Box>
          </Flex>
          <Divider mt={3} mb={1} mx={3} />
          {order.payment_status === "captured" && (
            <Flex>
              <Box pl={3} pr={5}>
                <Text pt={2}>Amount paid</Text>
                {order.refunded_total > 0 && <Text pt={2}>Refunded</Text>}
              </Box>
              <Box>
                <Text pt={2}>
                  {order.total} {order.region.currency_code}
                </Text>
                {order.refunded_total > 0 && (
                  <Text pt={2}>
                    {order.refunded_total} {order.currency_code}
                  </Text>
                )}
              </Box>
            </Flex>
          )}
        </Card.Body>
      </Card>
      {/* FULFILLMENT */}
      <Card mb={2}>
        <Card.Header
          badge={{
            label: order.fulfillment_status,
            color: fulfillmentColor,
            bgColor: fulfillmentBgColor,
          }}
        >
          Fulfillment
        </Card.Header>
        <Card.Body flexDirection="column">
          <Flex
            pb={3}
            sx={{
              borderBottom: "hairline",
            }}
          >
            {order.shipping_methods.map(method => (
              <Box key={method._id}>
                <Box pl={3} pr={2}>
                  <Text pb={1} color="gray">
                    Shipping Method
                  </Text>
                  <Text>{method.name}</Text>
                </Box>
                <Card.VerticalDivider mx={3} />
              </Box>
            ))}
          </Flex>
          <Flex p={3} width={1}>
            {order.fulfillments.length > 0 ? (
              order.fulfillments.map(fulfillment => (
                <Box key={fulfillment._id}>
                  <Text>Fulfilled by provider {fulfillment.provider_id}</Text>
                  <Text>
                    Tracking Number: {fulfillment.tracking_numbers.join(", ")}
                  </Text>
                </Box>
              ))
            ) : (
              <Text alignSelf={"center"} justifySelf={"center"}>
                Not yet fulfilled
              </Text>
            )}
          </Flex>
        </Card.Body>
      </Card>
      {/* CUSTOMER */}
      <Card mr={3} mb={2} width="100%">
        <Card.Header>Customer</Card.Header>
        <Card.Body>
          <Box px={3}>
            <Text color="gray">Contact</Text>
            <CustomerEmailLabel
              pt={3}
              customerExist={order.customer}
              onClick={() => {
                if (order.customer) {
                  navigate(`/a/customers/${order.customer._id}`)
                } else {
                  return
                }
              }}
            >
              {order.email}
            </CustomerEmailLabel>
            <Text pt={2}>
              {order.shipping_address.first_name}{" "}
              {order.shipping_address.last_name}
            </Text>
          </Box>
          <Card.VerticalDivider mx={3} />
          <Box px={3}>
            <Text color="gray">Shipping</Text>
            <Text pt={3}>{order.shipping_address.address_1}</Text>
            {order.shipping_address.address_2 && (
              <Text pt={2}>{order.shipping_address.address_2}</Text>
            )}
            <Text pt={2}>
              {order.shipping_address.postal_code} {order.shipping_address.city}
              , {order.shipping_address.country_code}
            </Text>
            <Text pt={2}>{order.shipping_address.country}</Text>
          </Box>
          <Card.VerticalDivider mx={3} />
          <Box px={3}>
            <Text color="gray">Billing</Text>
            <Text pt={3}>{order.billing_address.address_1}</Text>
            {order.billing_address.address_2 && (
              <Text pt={2}>{order.billing_address.address_2}</Text>
            )}
            <Text pt={2}>
              {order.billing_address.postal_code} {order.billing_address.city},{" "}
              {order.billing_address.country_code}
            </Text>
            <Text pt={2}>{order.billing_address.country}</Text>
          </Box>
        </Card.Body>
      </Card>
      {/* METADATA */}
      <Card mr={3} width="100%">
        <Card.Header>Raw order</Card.Header>
        <Card.Body>
          <ReactJson
            name={false}
            collapsed={true}
            src={order}
            style={{ marginLeft: "20px" }}
          />
        </Card.Body>
      </Card>
      {showReturnMenu && (
        <ReturnMenu
          onReturn={returnOrder}
          order={order}
          onDismiss={() => setShowReturnMenu(false)}
          toaster={toaster}
        />
      )}
      {showRefund && (
        <RefundMenu
          onRefund={refund}
          order={order}
          onDismiss={() => setShowRefund(false)}
          toaster={toaster}
        />
      )}
    </Flex>
  )
}

export default OrderDetails